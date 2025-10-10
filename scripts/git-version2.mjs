'use strict'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import git from 'simple-git'
import semver from 'semver'

const REPO_BASE = dirname(dirname(fileURLToPath(import.meta.url)))

export function monorepoGit() {
    return git({ baseDir: REPO_BASE })
}

export const detailsFromTag = tag => {
    if (tag.includes('@')) {
        const parts = tag.split('@')
        // Handle staging- prefix by removing it from the project name
        const project = parts[0].replace(/^staging-/, '')
        return [project, parts[1]]
    }
    return ['robot-stack', tag.substring(1)]
}

export function tagFromDetails(project, version) {
    const prefix = prefixForProject(project)
    return `${prefix}${version}`
}

export function prefixForProject(project) {
    if (project === 'robot-stack') {
        return 'v'
    } else {
        return `${project}@`
    }
}

export function prefixesForProject(project) {
    if (project === 'robot-stack') {
        return ['v']
    } else if (project === 'protocol-designer') {
        // Support both old and new tag patterns for protocol-designer
        // Order matters: protocol-designer takes precedence over staging-protocol-designer
        return [`${project}@`, `staging-${project}@`]
    } else {
        return [`${project}@`]
    }
}

export async function getTagsPointingAtHead(project) {
    const prefixes = prefixesForProject(project)
    const allTags = []

    // Get all tags pointing at HEAD for each prefix
    for (const prefix of prefixes) {
        try {
            const tags = (
                await monorepoGit().raw([
                    'tag',
                    '--points-at',
                    'HEAD',
                    `--list`,
                    `${prefix}*`,
                ])
            ).trim()

            if (tags) {
                // Can return multiple tags, one per line
                allTags.push(...tags.split('\n').filter(t => t.length > 0))
            }
        } catch (error) {
            // Continue to next prefix if this one doesn't match any tags
            continue
        }
    }

    return allTags
}

export async function getCurrentBranchName() {
    const isCI = process.env.CI === 'true'

    try {
        const branch = (
            await monorepoGit().raw(['rev-parse', '--abbrev-ref', 'HEAD'])
        ).trim()

        if (isCI) {
            console.log(`[git-version2] git rev-parse result: ${branch}`)
        }

        // Don't return 'HEAD' if we're in detached HEAD state
        if (branch === 'HEAD') {
            // Try to get branch from environment variables (common in CI)
            // GitHub Actions: 
            //   - GITHUB_HEAD_REF: branch name for PRs (e.g., "my-feature-branch")
            //   - GITHUB_REF_NAME: simplified ref name (e.g., "edge", "my-branch", "v1.0.0")
            //   - GITHUB_REF: full ref (e.g., "refs/heads/edge", "refs/tags/v1.0.0")

            let ciBranch = process.env.GITHUB_HEAD_REF || // PR branch
                process.env.GITHUB_REF_NAME // Branch or tag name

            // If GITHUB_REF_NAME is a tag (from GITHUB_REF_TYPE), skip it
            // We want branch names, not tag names here
            if (ciBranch === process.env.GITHUB_REF_NAME &&
                process.env.GITHUB_REF_TYPE === 'tag') {
                ciBranch = null
            }

            if (isCI) {
                console.log(`[git-version2] Resolved CI branch: ${ciBranch}`)
            }

            return ciBranch || null
        }

        return branch
    } catch (error) {
        // Try to get from environment as fallback
        const fallbackBranch = process.env.GITHUB_HEAD_REF ||
            process.env.GITHUB_REF_NAME ||
            process.env.CI_COMMIT_REF_NAME ||
            process.env.CIRCLE_BRANCH ||
            null

        if (isCI) {
            console.log(`[git-version2] git command failed, using fallback: ${fallbackBranch}`)
        }

        return fallbackBranch
    }
}

export function getTimestamp() {
    // Return ISO 8601 timestamp in compact format: YYYYMMDD-HHMMSS
    // e.g., "20251010-143022"
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

export function getBuildIdentifier() {
    // In CI, include the GitHub run ID for traceability
    // Format: timestamp-runId (e.g., "20251010-143022-1234567890")
    // In local dev, just use timestamp
    const timestamp = getTimestamp()
    const runId = process.env.GITHUB_RUN_ID

    if (runId) {
        return `${timestamp}-RUN_ID-${runId}`
    }

    return timestamp
}

export async function latestTagForProject(project) {
    // Debug logging for CI environments
    const isCI = process.env.CI === 'true'
    if (isCI) {
        console.log(`[git-version2] Running in CI environment`)
        console.log(`[git-version2] GITHUB_REF: ${process.env.GITHUB_REF}`)
        console.log(`[git-version2] GITHUB_REF_NAME: ${process.env.GITHUB_REF_NAME}`)
        console.log(`[git-version2] GITHUB_REF_TYPE: ${process.env.GITHUB_REF_TYPE}`)
        console.log(`[git-version2] GITHUB_HEAD_REF: ${process.env.GITHUB_HEAD_REF}`)
    }

    // First, try to get tags pointing at the current commit (HEAD)
    const tagsAtHead = await getTagsPointingAtHead(project)

    if (tagsAtHead.length > 0) {
        // If we have multiple tags, prefer non-staging tags, then select highest semver
        const prefixes = prefixesForProject(project)

        // Group tags by prefix
        const tagsByPrefix = {}
        for (const prefix of prefixes) {
            // Match tags that start with prefix (without @ in the comparison)
            const prefixWithoutAt = prefix.replace(/@$/, '')
            const matchingTags = tagsAtHead.filter(tag => {
                // Check if tag starts with the prefix pattern
                return tag.startsWith(prefixWithoutAt + '@') || tag.startsWith(prefixWithoutAt) && !tag.includes('@')
            })
            if (matchingTags.length > 0) {
                tagsByPrefix[prefix] = matchingTags
            }
        }

        // Check tags in order of preference (protocol-designer@ before staging-protocol-designer@)
        for (const prefix of prefixes) {
            const matchingTags = tagsByPrefix[prefix]
            if (matchingTags && matchingTags.length > 0) {
                // If multiple tags with same prefix, select the one with highest semver
                if (matchingTags.length === 1) {
                    return matchingTags[0]
                }

                // Parse versions and sort by semver
                const taggedVersions = matchingTags.map(tag => {
                    const [_, version] = detailsFromTag(tag)
                    return {
                        tag,
                        version,
                        // Try to parse as valid semver (supports prerelease tags)
                        // If that fails, try coerce (more lenient)
                        parsed: semver.valid(version) ? version : semver.coerce(version)
                    }
                })

                // Sort by semver (highest first)
                // Filter out any that couldn't be parsed, then sort valid ones
                const validVersions = taggedVersions.filter(tv => tv.parsed !== null)
                if (validVersions.length > 0) {
                    validVersions.sort((a, b) => semver.rcompare(a.parsed, b.parsed))
                    return validVersions[0].tag
                }

                // If no valid semver versions, just return first tag
                return taggedVersions[0].tag
            }
        }

        // Fallback to first tag if no preferred match (shouldn't happen)
        return tagsAtHead[0]
    }

    // No tags at HEAD, try to get branch name
    const branchName = await getCurrentBranchName()
    if (isCI) {
        console.log(`[git-version2] Branch name from getCurrentBranchName: ${branchName}`)
    }

    if (branchName) {
        // Use the full branch name with build identifier as the version
        // In CI, we use timestamp + run ID instead of SHA because the SHA would be the merge commit's SHA,
        // not the actual branch commit SHA
        const buildId = getBuildIdentifier()
        const versionString = `${branchName}-${buildId}`
        const fullVersion = `${prefixForProject(project)}${versionString}`

        if (isCI) {
            console.log(`[git-version2] Build identifier: ${buildId}`)
            console.log(`[git-version2] Final version string: ${fullVersion}`)
        }

        // Return a synthetic tag format that can be parsed by detailsFromTag
        return fullVersion
    }

    // Last resort: try git describe to get any nearby tag + offset
    try {
        const prefix = prefixForProject(project)
        const described = (
            await monorepoGit().raw([
                'describe',
                '--tags',
                '--abbrev=10',
                `--match=${prefix}*`,
            ])
        ).trim()

        if (described) {
            console.warn(`Using git describe fallback for ${project}: ${described}`)
            return described
        }
    } catch (error) {
        // git describe failed, continue to final error
    }

    // No tags at HEAD and no branch, throw error with debugging info
    throw new Error(
        `No tags found at HEAD for project ${project} and no branch name available. ` +
        `Env vars: GITHUB_REF_NAME=${process.env.GITHUB_REF_NAME}, ` +
        `GITHUB_HEAD_REF=${process.env.GITHUB_HEAD_REF}, ` +
        `CI_COMMIT_REF_NAME=${process.env.CI_COMMIT_REF_NAME}`
    )
}

export async function versionForProject(project) {
    return latestTagForProject(project)
        .then(tag => tag) // Return the full tag, not just the parsed version
        .catch(error => {
            console.error(
                `Could not find a version for project ${project} (${error}) - no tags yet or no tags fetched? Using 0.0.0-dev`
            )
            return '0.0.0-dev'
        })
}

export async function generateBuildInfoHtml(project, outputPath) {
    // Gather all build information
    const version = await versionForProject(project)
    const timestamp = getTimestamp()
    const isCI = process.env.CI === 'true'
    
    // Git information
    let gitInfo = {}
    try {
        const branch = await getCurrentBranchName()
        const tags = await getTagsPointingAtHead(project)
        const commitSha = (await monorepoGit().raw(['rev-parse', 'HEAD'])).trim()
        const shortSha = commitSha.substring(0, 7)
        const commitMessage = (await monorepoGit().raw(['log', '-1', '--pretty=%B'])).trim()
        const commitAuthor = (await monorepoGit().raw(['log', '-1', '--pretty=%an'])).trim()
        const commitDate = (await monorepoGit().raw(['log', '-1', '--pretty=%ci'])).trim()
        
        gitInfo = {
            branch,
            tags: tags.length > 0 ? tags : ['(none)'],
            commitSha,
            shortSha,
            commitMessage,
            commitAuthor,
            commitDate
        }
    } catch (error) {
        gitInfo = { error: error.message }
    }
    
    // GitHub Actions information
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
    const repository = process.env.GITHUB_REPOSITORY || 'N/A'
    const runId = process.env.GITHUB_RUN_ID
    const headRef = process.env.GITHUB_HEAD_REF
    const baseRef = process.env.GITHUB_BASE_REF
    
    const githubInfo = {
        // Run information
        runId: runId || 'N/A',
        runNumber: process.env.GITHUB_RUN_NUMBER || 'N/A',
        runAttempt: process.env.GITHUB_RUN_ATTEMPT || 'N/A',
        job: process.env.GITHUB_JOB || 'N/A',
        
        // Workflow information
        workflow: process.env.GITHUB_WORKFLOW || 'N/A',
        workflowRef: process.env.GITHUB_WORKFLOW_REF || 'N/A',
        workflowSha: process.env.GITHUB_WORKFLOW_SHA || 'N/A',
        
        // Actor information
        actor: process.env.GITHUB_ACTOR || 'N/A',
        actorId: process.env.GITHUB_ACTOR_ID || 'N/A',
        triggeringActor: process.env.GITHUB_TRIGGERING_ACTOR || 'N/A',
        
        // Event information
        event: process.env.GITHUB_EVENT_NAME || 'N/A',
        eventPath: process.env.GITHUB_EVENT_PATH || 'N/A',
        
        // Ref information
        ref: process.env.GITHUB_REF || 'N/A',
        refName: process.env.GITHUB_REF_NAME || 'N/A',
        refType: process.env.GITHUB_REF_TYPE || 'N/A',
        refProtected: process.env.GITHUB_REF_PROTECTED || 'N/A',
        headRef: headRef || 'N/A',
        baseRef: baseRef || 'N/A',
        
        // Repository information
        repository: repository,
        repositoryId: process.env.GITHUB_REPOSITORY_ID || 'N/A',
        repositoryOwner: process.env.GITHUB_REPOSITORY_OWNER || 'N/A',
        repositoryOwnerId: process.env.GITHUB_REPOSITORY_OWNER_ID || 'N/A',
        
        // Environment
        environment: process.env.GITHUB_ENV || 'N/A',
        
        // URLs
        serverUrl: serverUrl,
        apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
        graphqlUrl: process.env.GITHUB_GRAPHQL_URL || 'https://api.github.com/graphql',
        
        // Constructed links
        runUrl: runId && repository 
            ? `${serverUrl}/${repository}/actions/runs/${runId}`
            : null,
        jobUrl: runId && repository && process.env.GITHUB_JOB
            ? `${serverUrl}/${repository}/actions/runs/${runId}/job/${process.env.GITHUB_JOB}`
            : null,
        compareUrl: headRef && baseRef && repository
            ? `${serverUrl}/${repository}/compare/${baseRef}...${headRef}`
            : null,
        prUrl: headRef && repository && process.env.GITHUB_EVENT_NAME === 'pull_request'
            ? `${serverUrl}/${repository}/pull/${process.env.GITHUB_REF_NAME?.replace('refs/pull/', '').replace('/merge', '')}`
            : null,
        branchUrl: process.env.GITHUB_REF_TYPE === 'branch' && process.env.GITHUB_REF_NAME && repository
            ? `${serverUrl}/${repository}/tree/${process.env.GITHUB_REF_NAME}`
            : null,
        tagUrl: process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME && repository
            ? `${serverUrl}/${repository}/releases/tag/${process.env.GITHUB_REF_NAME}`
            : null
    }
    
    // Build information
    const buildInfo = {
        project,
        version,
        timestamp,
        buildDate: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        isCI
    }
    
    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Build Information - ${project}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .version {
            font-size: 1.5rem;
            font-weight: 600;
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            display: inline-block;
            margin-top: 1rem;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        .content {
            padding: 2rem;
        }
        .section {
            margin-bottom: 2rem;
        }
        .section:last-child {
            margin-bottom: 0;
        }
        .section h2 {
            color: #667eea;
            font-size: 1.3rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #667eea;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        .info-item {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }
        .info-label {
            font-weight: 600;
            color: #667eea;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        .info-value {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
            color: #333;
            word-break: break-all;
        }
        .info-value a {
            color: #667eea;
            text-decoration: none;
        }
        .info-value a:hover {
            text-decoration: underline;
        }
        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .tag {
            background: #667eea;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge.ci {
            background: #28a745;
            color: white;
        }
        .badge.local {
            background: #ffc107;
            color: #333;
        }
        .commit-message {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
            white-space: pre-wrap;
            margin-top: 0.5rem;
        }
        .footer {
            background: #f8f9fa;
            padding: 1rem 2rem;
            text-align: center;
            color: #666;
            font-size: 0.85rem;
        }
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            .header h1 {
                font-size: 1.5rem;
            }
            .version {
                font-size: 1.2rem;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Build Information</h1>
            <div class="version">${version}</div>
            <div style="margin-top: 1rem;">
                <span class="badge ${isCI ? 'ci' : 'local'}">${isCI ? 'CI Build' : 'Local Build'}</span>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📦 Build Details</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Project</div>
                        <div class="info-value">${buildInfo.project}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Version</div>
                        <div class="info-value">${buildInfo.version}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Build Timestamp</div>
                        <div class="info-value">${buildInfo.timestamp}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Build Date (ISO)</div>
                        <div class="info-value">${buildInfo.buildDate}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Node Version</div>
                        <div class="info-value">${buildInfo.nodeVersion}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Platform</div>
                        <div class="info-value">${buildInfo.platform} (${buildInfo.arch})</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🌿 Git Information</h2>
                ${gitInfo.error ? `
                    <div class="info-item">
                        <div class="info-label">Error</div>
                        <div class="info-value">${gitInfo.error}</div>
                    </div>
                ` : `
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Branch</div>
                            <div class="info-value">${gitInfo.branch || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Commit SHA</div>
                            <div class="info-value">${gitInfo.commitSha}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Short SHA</div>
                            <div class="info-value">${gitInfo.shortSha}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Commit Author</div>
                            <div class="info-value">${gitInfo.commitAuthor}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Commit Date</div>
                            <div class="info-value">${gitInfo.commitDate}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Tags at HEAD</div>
                            <div class="tag-list">
                                ${gitInfo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="info-item" style="margin-top: 1rem;">
                        <div class="info-label">Commit Message</div>
                        <div class="commit-message">${gitInfo.commitMessage}</div>
                    </div>
                `}
            </div>
            
            ${isCI ? `
            <div class="section">
                <h2>🚀 GitHub Actions Information</h2>
                
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">🔗 Quick Links</h3>
                <div class="info-grid">
                    ${githubInfo.runUrl ? `
                    <div class="info-item">
                        <div class="info-label">Workflow Run</div>
                        <div class="info-value">
                            <a href="${githubInfo.runUrl}" target="_blank">View Run #${githubInfo.runNumber}</a>
                        </div>
                    </div>
                    ` : ''}
                    ${githubInfo.jobUrl ? `
                    <div class="info-item">
                        <div class="info-label">Job</div>
                        <div class="info-value">
                            <a href="${githubInfo.jobUrl}" target="_blank">View Job: ${githubInfo.job}</a>
                        </div>
                    </div>
                    ` : ''}

                    ${githubInfo.prUrl ? `
                    <div class="info-item">
                        <div class="info-label">Pull Request</div>
                        <div class="info-value">
                            <a href="${githubInfo.prUrl}" target="_blank">View PR</a>
                        </div>
                    </div>
                    ` : ''}
                    ${githubInfo.compareUrl ? `
                    <div class="info-item">
                        <div class="info-label">Compare Changes</div>
                        <div class="info-value">
                            <a href="${githubInfo.compareUrl}" target="_blank">${githubInfo.baseRef}...${githubInfo.headRef}</a>
                        </div>
                    </div>
                    ` : ''}
                    ${githubInfo.branchUrl ? `
                    <div class="info-item">
                        <div class="info-label">Branch</div>
                        <div class="info-value">
                            <a href="${githubInfo.branchUrl}" target="_blank">${githubInfo.refName}</a>
                        </div>
                    </div>
                    ` : ''}
                    ${githubInfo.tagUrl ? `
                    <div class="info-item">
                        <div class="info-label">Tag</div>
                        <div class="info-value">
                            <a href="${githubInfo.tagUrl}" target="_blank">${githubInfo.refName}</a>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">📊 Run Details</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Run ID</div>
                        <div class="info-value">${githubInfo.runId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Run Number</div>
                        <div class="info-value">${githubInfo.runNumber}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Run Attempt</div>
                        <div class="info-value">${githubInfo.runAttempt}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Job</div>
                        <div class="info-value">${githubInfo.job}</div>
                    </div>
                </div>
                
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">⚙️ Workflow Details</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Workflow Name</div>
                        <div class="info-value">${githubInfo.workflow}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Workflow Ref</div>
                        <div class="info-value">${githubInfo.workflowRef}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Workflow SHA</div>
                        <div class="info-value">${githubInfo.workflowSha !== 'N/A' ? githubInfo.workflowSha.substring(0, 7) : 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Event</div>
                        <div class="info-value">${githubInfo.event}</div>
                    </div>
                </div>
                
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">👤 Actor Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Actor</div>
                        <div class="info-value">
                            ${githubInfo.actor !== 'N/A' 
                                ? `<a href="${githubInfo.serverUrl}/${githubInfo.actor}" target="_blank">${githubInfo.actor}</a>`
                                : 'N/A'}
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Actor ID</div>
                        <div class="info-value">${githubInfo.actorId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Triggering Actor</div>
                        <div class="info-value">
                            ${githubInfo.triggeringActor !== 'N/A' 
                                ? `<a href="${githubInfo.serverUrl}/${githubInfo.triggeringActor}" target="_blank">${githubInfo.triggeringActor}</a>`
                                : 'N/A'}
                        </div>
                    </div>
                </div>
                
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">📍 Reference Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Ref</div>
                        <div class="info-value">${githubInfo.ref}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Ref Name</div>
                        <div class="info-value">${githubInfo.refName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Ref Type</div>
                        <div class="info-value">${githubInfo.refType}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Ref Protected</div>
                        <div class="info-value">${githubInfo.refProtected}</div>
                    </div>
                    ${githubInfo.headRef !== 'N/A' ? `
                    <div class="info-item">
                        <div class="info-label">Head Ref (PR)</div>
                        <div class="info-value">${githubInfo.headRef}</div>
                    </div>
                    ` : ''}
                    ${githubInfo.baseRef !== 'N/A' ? `
                    <div class="info-item">
                        <div class="info-label">Base Ref (PR)</div>
                        <div class="info-value">${githubInfo.baseRef}</div>
                    </div>
                    ` : ''}
                </div>
                
                <h3 style="color: #764ba2; font-size: 1.1rem; margin-bottom: 1rem; margin-top: 1.5rem;">🏢 Repository Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Repository</div>
                        <div class="info-value">
                            ${githubInfo.repository !== 'N/A' 
                                ? `<a href="${githubInfo.serverUrl}/${githubInfo.repository}" target="_blank">${githubInfo.repository}</a>`
                                : 'N/A'}
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Repository ID</div>
                        <div class="info-value">${githubInfo.repositoryId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Repository Owner</div>
                        <div class="info-value">
                            ${githubInfo.repositoryOwner !== 'N/A' 
                                ? `<a href="${githubInfo.serverUrl}/${githubInfo.repositoryOwner}" target="_blank">${githubInfo.repositoryOwner}</a>`
                                : 'N/A'}
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Owner ID</div>
                        <div class="info-value">${githubInfo.repositoryOwnerId}</div>
                    </div>
                </div>
                
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            Generated by git-version2.mjs on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`
    
    // Write the HTML file
    const fs = await import('fs')
    const path = await import('path')
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    await fs.promises.mkdir(outputDir, { recursive: true })
    
    // Write the file
    await fs.promises.writeFile(outputPath, html, 'utf-8')
    
    console.log(`✅ Build info HTML generated: ${outputPath}`)
    
    return outputPath
}

export async function latestLabwareVersions(appVersion) {
    // Returns a map of {labware load name -> highest available version number}
    // as of app release `appVersion`.

    // Max says PD only needs to worry about labware schema 2:
    const labwareDir = 'shared-data/labware/definitions/2/'
    // Fetch all labware definition files that existed in the app at `version`:
    const lstreeCmd = ['ls-tree', '-r', '--name-only', '-z']
    // We will first look for a release tag named `v${version}`.
    // If that doesn't exist, look for a branch named `chore_release-${version}`.
    const releaseTag = `v${appVersion}`
    const choreBranch = `origin/chore_release-${appVersion}`
    const labwareFiles = (
        await monorepoGit()
            .raw([...lstreeCmd, releaseTag, labwareDir])
            .catch(error =>
                monorepoGit().raw([...lstreeCmd, choreBranch, labwareDir])
            )
    )
        .split('\0')
        .slice(0, -1) // git puts an extra '\0' at the end, remove it
        .map(filename => filename.replace(labwareDir, ''))
    // labwareFiles is a list like: ['agilent_1_reservoir_290ml/1.json', ...]

    // For each loadname in labwareFiles, return the highest labware version:
    return labwareFiles.reduce((acc, filename) => {
        const [loadName, jsonFilename] = filename.split('/')
        const labwareVersion = Number(jsonFilename.replace('.json', ''))
        if (!acc[loadName] || labwareVersion > acc[loadName]) {
            acc[loadName] = labwareVersion
        }
        return acc
    }, {})
}
