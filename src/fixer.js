'use strict'

const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const { promisify } = require('util')
const Anthropic = require('@anthropic-ai/sdk')
const { parseLogs } = require('./parser')

const execFileAsync = promisify(execFile)

const MAX_FILE_BYTES = 8000
const MAX_LOG_BYTES = 6000

/**
 * Read a source file safely, returning its content (truncated if large).
 * @param {string} filePath
 * @returns {string|null}
 */
function readSourceFile(filePath) {
  try {
    const resolved = path.resolve(filePath)
    const stat = fs.statSync(resolved)
    if (stat.size > MAX_FILE_BYTES * 10) return null // skip huge binaries
    const content = fs.readFileSync(resolved, 'utf8')
    return content.length > MAX_FILE_BYTES
      ? content.slice(0, MAX_FILE_BYTES) + '\n... (truncated)'
      : content
  } catch {
    return null
  }
}

/**
 * Gather source files referenced in the error.
 * @param {object} parsed - Output from parseLogs()
 * @returns {Array<{path: string, content: string, line: number|null}>}
 */
function gatherSourceContext(parsed) {
  const files = []
  const seen = new Set()

  for (const { path: filePath, line } of parsed.filePaths) {
    if (seen.has(filePath)) continue
    seen.add(filePath)
    const content = readSourceFile(filePath)
    if (content !== null) {
      files.push({ path: filePath, content, line })
    }
  }

  // Also try package.json if present
  if (!seen.has('package.json') && fs.existsSync('package.json')) {
    const content = readSourceFile('package.json')
    if (content) files.push({ path: 'package.json', content, line: null })
  }

  return files
}

/**
 * Build the prompt for Anthropic.
 */
function buildPrompt(parsed, sourceFiles) {
  const logSnippet = parsed.rawLogs.length > MAX_LOG_BYTES
    ? '...' + parsed.rawLogs.slice(-MAX_LOG_BYTES)
    : parsed.rawLogs

  let prompt = `## CI Failure Log\n\`\`\`\n${logSnippet}\n\`\`\`\n\n`
  prompt += `## Error Summary\n${parsed.errorMessage}\n\n`

  if (parsed.failingCommand) {
    prompt += `## Failing Command\n\`${parsed.failingCommand}\`\n\n`
  }

  if (sourceFiles.length > 0) {
    prompt += '## Relevant Source Files\n'
    for (const { path: filePath, content, line } of sourceFiles) {
      const lineHint = line ? ` (error near line ${line})` : ''
      prompt += `\n### ${filePath}${lineHint}\n\`\`\`\n${content}\n\`\`\`\n`
    }
  }

  prompt += `
## Task
Identify the exact cause of the CI failure and provide the minimal fix.

Respond in this exact JSON format (no markdown wrapper):
{
  "explanation": "One sentence describing what caused the failure",
  "fixes": [
    {
      "path": "relative/path/to/file.js",
      "content": "full file content after fix"
    }
  ]
}

Rules:
- Only include files that need changes
- Provide the FULL file content (not a diff)
- Keep changes minimal — fix the error, nothing else
- If the fix requires a new dependency, note it in explanation instead
`

  return prompt
}

/**
 * Parse the AI response into fix instructions.
 * @param {string} responseText
 * @returns {{explanation: string, fixes: Array<{path: string, content: string}>}}
 */
function parseAIResponse(responseText) {
  const cleaned = responseText.trim().replace(/^```json\n?|```$/g, '')
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${responseText.slice(0, 200)}`)
  }
}

/**
 * Apply file fixes to disk.
 * @param {Array<{path: string, content: string}>} fixes
 */
function applyFixes(fixes) {
  for (const { path: filePath, content } of fixes) {
    const resolved = path.resolve(filePath)
    fs.mkdirSync(path.dirname(resolved), { recursive: true })
    fs.writeFileSync(resolved, content, 'utf8')
  }
}

/**
 * Re-run the failing command to verify the fix worked.
 * @param {string} command - e.g. "npm test"
 * @returns {Promise<{success: boolean, output: string}>}
 */
async function verifyFix(command) {
  if (!command) return { success: true, output: '(no command to verify)' }

  try {
    const [cmd, ...args] = command.split(' ')
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout: 120_000,
      env: { ...process.env }
    })
    return { success: true, output: stdout + stderr }
  } catch (err) {
    return { success: false, output: err.stdout + err.stderr + err.message }
  }
}

/**
 * Main fix loop — attempts up to maxAttempts times.
 * @param {string} logs - Raw CI failure logs
 * @param {string} apiKey - Anthropic API key
 * @param {number} maxAttempts
 * @returns {Promise<{success: boolean, explanation: string, fixes: Array, sha: string|null}>}
 */
async function fixWithAI(logs, apiKey, maxAttempts = 3) {
  const client = new Anthropic({ apiKey })
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const parsed = parseLogs(logs + (lastError ? `\n\nPrevious fix attempt failed:\n${lastError}` : ''))
    const sourceFiles = gatherSourceContext(parsed)
    const userPrompt = buildPrompt(parsed, sourceFiles)

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: 'You are a CI repair bot. Given build or test failure logs, identify the exact file and line causing the failure, and provide the minimal fix. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: userPrompt }]
    })

    const responseText = message.content[0]?.text || ''
    let result
    try {
      result = parseAIResponse(responseText)
    } catch (err) {
      lastError = err.message
      continue
    }

    applyFixes(result.fixes)

    const verification = await verifyFix(parsed.failingCommand)
    if (verification.success) {
      return {
        success: true,
        explanation: result.explanation,
        fixes: result.fixes,
        sha: null
      }
    }

    // Feed verification failure back into next attempt
    lastError = `Re-run of "${parsed.failingCommand}" still failed:\n${verification.output.slice(-2000)}`
  }

  return {
    success: false,
    explanation: `Failed after ${maxAttempts} attempts. Last error: ${lastError}`,
    fixes: [],
    sha: null
  }
}

module.exports = { fixWithAI, applyFixes, verifyFix, gatherSourceContext }
