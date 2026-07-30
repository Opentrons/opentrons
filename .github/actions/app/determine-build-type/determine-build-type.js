'use strict'

/**
 * @typedef {'develop' | 'release' | 'as-release'} BuildType
 * @typedef {'release' | 'internal-release'} BuildVariant
 *
 * @typedef {Object} DetermineBuildTypeInput
 * @property {string} eventName
 * @property {string} ref
 * @property {number} runId
 * @property {boolean} skipPullRequests
 * @property {'once-per-day' | 'always'} edgeBuildPolicy
 * @property {string} [repository]
 * @property {string} [githubToken]
 * @property {string} [workflowFile]
 *
 * @typedef {Object} DetermineBuildTypeResult
 * @property {BuildVariant[]} variants
 * @property {BuildType} type
 * @property {string} message
 */

/** @returns {DetermineBuildTypeResult} */
function buildResult(variants, type, message) {
  return { variants, type, message }
}

/** @returns {BuildType} */
function typeFromAsRelease(ref, developType, asReleaseType) {
  return ref.includes('as-release') ? asReleaseType : developType
}

/**
 * @param {DetermineBuildTypeInput} input
 * @returns {Promise<DetermineBuildTypeResult>}
 */
async function determineBuildType(input) {
  const {
    eventName,
    ref,
    runId,
    skipPullRequests,
    edgeBuildPolicy,
    repository,
    githubToken,
    workflowFile = 'app-test-build-deploy.yaml',
  } = input

  console.log(`Determining build type for event ${eventName} and ref ${ref}`)

  if (skipPullRequests && eventName === 'pull_request') {
    return buildResult([], 'develop', 'No builds for pull requests')
  }

  if (ref.startsWith('refs/tags/ot3')) {
    return buildResult(
      ['internal-release'],
      'release',
      'internal-release release builds for ot3 tags'
    )
  }

  if (ref.startsWith('refs/tags/v')) {
    return buildResult(
      ['release'],
      'release',
      'release release builds for v tags'
    )
  }

  if (ref.startsWith('refs/heads/internal-release')) {
    return buildResult(
      ['internal-release'],
      'develop',
      'internal-release develop builds for internal-release branches'
    )
  }

  if (
    ref.startsWith('refs/heads/release') ||
    ref.startsWith('refs/heads/chore_release')
  ) {
    return buildResult(
      ['release'],
      'develop',
      'Release develop builds for release branches'
    )
  }

  if (ref === 'refs/heads/edge') {
    if (edgeBuildPolicy === 'always') {
      return buildResult(
        ['release', 'internal-release'],
        'develop',
        'both develop builds for edge (manual)'
      )
    }

    const earlierRuns = await countEarlierEdgeRunsToday({
      repository,
      runId,
      githubToken,
      workflowFile,
    })

    if (earlierRuns > 0) {
      return buildResult(
        [],
        'develop',
        'edge push: another workflow run for this workflow on edge already started earlier today (UTC); skipping develop build'
      )
    }

    return buildResult(
      ['release', 'internal-release'],
      'develop',
      'edge push: develop build (first push today in UTC, or no earlier run detected)'
    )
  }

  if (ref.includes('app-build-internal')) {
    const type = typeFromAsRelease(ref, 'develop', 'as-release')
    return buildResult(
      ['internal-release'],
      type,
      type === 'as-release'
        ? 'internal-release as-release builds for app-build-internal + as-release suffixes'
        : 'internal-release develop builds for app-build-internal suffixes'
    )
  }

  if (ref.includes('app-build-both')) {
    const type = typeFromAsRelease(ref, 'develop', 'as-release')
    return buildResult(
      ['release', 'internal-release'],
      type,
      type === 'as-release'
        ? 'Both as-release builds for app-build-both + as-release suffixes'
        : 'Both develop builds for app-build-both suffixes'
    )
  }

  if (ref.includes('app-build')) {
    const type = typeFromAsRelease(ref, 'develop', 'as-release')
    return buildResult(
      ['release'],
      type,
      type === 'as-release'
        ? 'release as-release builds for app-build + as-release suffixes'
        : 'release develop builds for app-build suffixes'
    )
  }

  return buildResult(
    [],
    'develop',
    `No build for ref ${ref} and event ${eventName}`
  )
}

/**
 * @param {Object} params
 * @param {string} [params.repository]
 * @param {number} params.runId
 * @param {string} [params.githubToken]
 * @param {string} params.workflowFile
 * @returns {Promise<number>}
 */
async function countEarlierEdgeRunsToday({
  repository,
  runId,
  githubToken,
  workflowFile,
}) {
  if (!repository || !githubToken) {
    console.log(
      '⚠️ Missing repository or token; allowing develop build (fail open)'
    )
    return 0
  }

  const today = new Date().toISOString().slice(0, 10)
  const url = `https://api.github.com/repos/${repository}/actions/workflows/${workflowFile}/runs?branch=edge&event=push&per_page=50`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }

    const data = await response.json()
    const earlier = (data.workflow_runs ?? []).filter(
      run => run.created_at.startsWith(today) && run.id < runId
    ).length

    if (!Number.isInteger(earlier)) {
      console.log(
        '⚠️ Unexpected API response; allowing develop build (fail open)'
      )
      return 0
    }

    return earlier
  } catch (error) {
    console.log(
      `⚠️ Could not list workflow runs (${error.message}); allowing develop build (fail open)`
    )
    return 0
  }
}

module.exports = {
  determineBuildType,
  countEarlierEdgeRunsToday,
}
