'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { fixWithAI } = require('./fixer')

const execFileAsync = promisify(execFile)

/**
 * Fetch the logs for the most recently failed step in this workflow run.
 * @param {object} octokit
 * @param {object} context
 * @returns {Promise<string>}
 */
async function getFailedStepLogs(octokit, context) {
  const { owner, repo } = context.repo
  const runId = context.runId

  // Get all jobs for this run
  const { data: jobsData } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId
  })

  // Find a failed job that is not this felix job
  const failedJob = jobsData.jobs.find(j =>
    j.conclusion === 'failure' && !j.name.toLowerCase().includes('felix')
  )

  if (!failedJob) {
    throw new Error('No failed job found in this run (other than felix itself).')
  }

  core.info(`Failed job: ${failedJob.name} (id: ${failedJob.id})`)

  // Download logs for that job
  const { data: logsData } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
    owner,
    repo,
    job_id: failedJob.id
  })

  // logsData is a string (text/plain redirect followed by octokit)
  return typeof logsData === 'string' ? logsData : JSON.stringify(logsData)
}

/**
 * Git add, commit, and push the fixes.
 * @param {Array<{path: string}>} fixes
 * @returns {Promise<string>} - commit SHA
 */
async function commitAndPush(fixes) {
  const filePaths = fixes.map(f => f.path)

  // Configure git identity for the action
  await execFileAsync('git', ['config', 'user.email', 'felix-bot@users.noreply.github.com'])
  await execFileAsync('git', ['config', 'user.name', 'Fix It Felix'])

  // Stage only the fixed files
  await execFileAsync('git', ['add', '--', ...filePaths])

  const { stdout: diffStat } = await execFileAsync('git', ['diff', '--cached', '--stat'])
  if (!diffStat.trim()) {
    throw new Error('No staged changes — fix produced no file changes.')
  }

  await execFileAsync('git', ['commit', '-m', 'fix: auto-fix CI failure [felix]'])

  const { stdout: sha } = await execFileAsync('git', ['rev-parse', 'HEAD'])

  await execFileAsync('git', ['push'])

  return sha.trim().slice(0, 7)
}

/**
 * Post a comment on the PR that triggered this run.
 * @param {object} octokit
 * @param {object} context
 * @param {string} body
 */
async function commentOnPR(octokit, context, body) {
  const { owner, repo } = context.repo
  const payload = context.payload

  const prNumber = payload.pull_request?.number || payload.workflow_run?.pull_requests?.[0]?.number

  if (!prNumber) {
    core.warning('No PR number found — skipping comment.')
    return
  }

  await octokit.rest.issues.createComment({ owner, repo, issue_number: prNumber, body })
}

/**
 * Action entry point.
 */
async function run() {
  try {
    const apiKey = core.getInput('anthropic-api-key', { required: true })
    const autoPush = core.getInput('auto-push') !== 'false'
    const maxAttempts = parseInt(core.getInput('max-attempts') || '3', 10)

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      core.setFailed('GITHUB_TOKEN environment variable is required.')
      return
    }

    const octokit = github.getOctokit(token)
    const context = github.context

    core.info('Felix is reading the failure logs...')
    const logs = await getFailedStepLogs(octokit, context)

    core.info(`Logs fetched (${logs.length} chars). Asking AI for a fix...`)
    const result = await fixWithAI(logs, apiKey, maxAttempts)

    if (!result.success) {
      core.warning(`Felix could not fix this one: ${result.explanation}`)
      await commentOnPR(octokit, context,
        `> **Felix tried but couldn't fix this automatically.**\n>\n> ${result.explanation}\n>\n> You'll need to fix this one manually.`
      )
      core.setFailed('Felix could not fix the CI failure.')
      return
    }

    core.info(`Fix found: ${result.explanation}`)
    core.info(`Files changed: ${result.fixes.map(f => f.path).join(', ')}`)

    let sha = null
    if (autoPush && result.fixes.length > 0) {
      core.info('Pushing fix...')
      sha = await commitAndPush(result.fixes)
      core.info(`Pushed commit ${sha}`)
    }

    const fileList = result.fixes.map(f => `\`${f.path}\``).join(', ')
    const shaText = sha ? ` See commit \`${sha}\`.` : ''
    const comment = [
      '> **Fixed it for you!**',
      '>',
      `> ${result.explanation}`,
      '>',
      `> **Changed:** ${fileList}${shaText}`
    ].join('\n')

    await commentOnPR(octokit, context, comment)

    core.setOutput('fixed', 'true')
    core.setOutput('explanation', result.explanation)
    core.setOutput('sha', sha || '')
    core.info('Felix is done.')
  } catch (error) {
    core.setFailed(`Felix encountered an error: ${error.message}`)
  }
}

run()
