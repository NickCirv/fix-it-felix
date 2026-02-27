'use strict'

/**
 * Parse CI failure logs to extract actionable error information.
 */

const FILE_PATH_PATTERN = /(?:^|\s)((?:\.\/|\/)?(?:[\w-]+\/)*[\w-]+\.[a-z]{1,5})(?::(\d+)(?::(\d+))?)?/gim
const STACK_FRAME_PATTERN = /at .+ \((.+):(\d+):(\d+)\)/g
const NPM_ERROR_PATTERN = /npm ERR! (.+)/g
const NODE_ERROR_PATTERN = /(?:Error|TypeError|SyntaxError|ReferenceError): (.+)/g
const JEST_FAIL_PATTERN = /FAIL (.+\.(?:test|spec)\.[jt]sx?)/g
const TS_ERROR_PATTERN = /(.+)\((\d+),(\d+)\): error TS\d+: (.+)/g

/**
 * Extract all file paths and line numbers from log text.
 * @param {string} logs - Raw CI log output
 * @returns {Array<{path: string, line: number|null, col: number|null}>}
 */
function extractFilePaths(logs) {
  const seen = new Set()
  const results = []

  // TypeScript compiler errors — highest signal
  let match
  const tsRe = new RegExp(TS_ERROR_PATTERN.source, 'gm')
  while ((match = tsRe.exec(logs)) !== null) {
    const [, path, line, col] = match
    const key = `${path}:${line}`
    if (!seen.has(key) && isSourceFile(path)) {
      seen.add(key)
      results.push({ path: path.trim(), line: parseInt(line, 10), col: parseInt(col, 10) })
    }
  }

  // Stack traces
  const stackRe = new RegExp(STACK_FRAME_PATTERN.source, 'gm')
  while ((match = stackRe.exec(logs)) !== null) {
    const [, path, line, col] = match
    const key = `${path}:${line}`
    if (!seen.has(key) && isSourceFile(path) && !path.includes('node_modules')) {
      seen.add(key)
      results.push({ path: path.trim(), line: parseInt(line, 10), col: parseInt(col, 10) })
    }
  }

  // Generic file:line references
  const fileRe = new RegExp(FILE_PATH_PATTERN.source, 'gim')
  while ((match = fileRe.exec(logs)) !== null) {
    const [, path, line, col] = match
    const key = `${path}:${line || ''}`
    if (!seen.has(key) && isSourceFile(path) && !path.includes('node_modules')) {
      seen.add(key)
      results.push({
        path: path.trim(),
        line: line ? parseInt(line, 10) : null,
        col: col ? parseInt(col, 10) : null
      })
    }
  }

  return results
}

/**
 * Extract the primary error message from logs.
 * @param {string} logs
 * @returns {string}
 */
function extractErrorMessage(logs) {
  const lines = logs.split('\n')

  // Look for the most descriptive error line
  for (const pattern of [TS_ERROR_PATTERN, NODE_ERROR_PATTERN, NPM_ERROR_PATTERN]) {
    const re = new RegExp(pattern.source, 'm')
    const match = re.exec(logs)
    if (match) {
      return match[0].trim()
    }
  }

  // Fall back to the last non-empty line that looks like an error
  const errorLines = lines.filter(l =>
    l.toLowerCase().includes('error') ||
    l.toLowerCase().includes('failed') ||
    l.toLowerCase().includes('cannot find')
  )

  return errorLines[0]?.trim() || 'Unknown error'
}

/**
 * Extract the failing command from logs.
 * @param {string} logs
 * @returns {string|null}
 */
function extractFailingCommand(logs) {
  const runPattern = /^\$ (.+)$/m
  const match = runPattern.exec(logs)
  return match ? match[1].trim() : null
}

/**
 * Extract Jest-specific test failures.
 * @param {string} logs
 * @returns {Array<{file: string, tests: string[]}>}
 */
function extractJestFailures(logs) {
  const failures = []
  const re = new RegExp(JEST_FAIL_PATTERN.source, 'gm')
  let match
  while ((match = re.exec(logs)) !== null) {
    failures.push({ file: match[1], tests: [] })
  }

  // Extract individual test names
  const testNamePattern = /● (.+)/g
  while ((match = testNamePattern.exec(logs)) !== null) {
    if (failures.length > 0) {
      failures[failures.length - 1].tests.push(match[1].trim())
    }
  }

  return failures
}

/**
 * Full parse — returns structured error context.
 * @param {string} logs - Raw CI log output
 * @returns {object}
 */
function parseLogs(logs) {
  return {
    errorMessage: extractErrorMessage(logs),
    failingCommand: extractFailingCommand(logs),
    filePaths: extractFilePaths(logs),
    jestFailures: extractJestFailures(logs),
    rawLogs: logs
  }
}

/**
 * Check if a path looks like a source file we'd want to fix.
 * @param {string} path
 * @returns {boolean}
 */
function isSourceFile(path) {
  return /\.[jt]sx?$|\.mjs$|\.cjs$|\.ts$|\.tsx$/.test(path)
}

module.exports = { parseLogs, extractFilePaths, extractErrorMessage, extractFailingCommand }
