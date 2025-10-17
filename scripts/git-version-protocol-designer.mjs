'use strict'

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import git from 'simple-git'
import semver from 'semver'

const REPO_BASE = dirname(dirname(fileURLToPath(import.meta.url)))
const PROJECT = 'protocol-designer'

// Tag prefixes in priority order (production > staging)
const TAG_PREFIXES = [
    `${PROJECT}@`,
    `staging-${PROJECT}@`
]

export function monorepoGit() {
    return git({ baseDir: REPO_BASE })
}

export const versionFromTag = tag => {
    // Extract version from tag format: protocol-designer@8.6.0 or staging-protocol-designer@8.6.0
    const parts = tag.split('@')
    return parts[1]
}

export async function getTagsPointingAtHead() {
    try {
        const tags = (
            await monorepoGit().raw([
                'tag',
                '--points-at',
                'HEAD',
                '--list',
                ...TAG_PREFIXES.map(prefix => `${prefix}*`),
            ])
        ).trim()

        if (tags) {
            return tags.split('\n').filter(t => t.length > 0)
        }
    } catch (error) {
        // No tags found or git error
    }

    return []
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

        if (branch === 'HEAD') {
            // Detached HEAD state - try CI environment variables
            let ciBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME

            // Skip if this is a tag ref, not a branch
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
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const hours = String(now.getUTCHours()).padStart(2, '0')
    const minutes = String(now.getUTCMinutes()).padStart(2, '0')
    const seconds = String(now.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

export async function getLatestTag() {
    const gitClient = monorepoGit()
    const candidates = []

    // Get all tags reachable from HEAD (all prefixes in one call)
    try {
        const tagsOutput = (
            await gitClient.raw([
                'tag',
                '--merged',
                'HEAD',
                '--list',
                ...TAG_PREFIXES.map(prefix => `${prefix}*`),
            ])
        ).trim()

        if (tagsOutput.length === 0) {
            throw new Error(`No matching tags found for ${PROJECT}.`)
        }

        const tags = tagsOutput.split('\n').filter(t => t.length > 0)

        // Parse version from each tag and add to candidates
        for (const tag of tags) {
            try {
                const version = versionFromTag(tag)
                const parsedVersion = semver.parse(version)

                if (parsedVersion != null) {
                    // Determine which prefix this tag uses
                    const prefix = TAG_PREFIXES.find(p => tag.startsWith(p))
                    
                    candidates.push({
                        tag,
                        version: parsedVersion,
                        prefix,
                    })
                }
            } catch (error) {
                // Skip tags that don't have valid semver
                continue
            }
        }
    } catch (error) {
        throw new Error(`No matching tags found for ${PROJECT}.`)
    }

    if (candidates.length === 0) {
        throw new Error(`No matching tags found for ${PROJECT}.`)
    }

    // Sort by semantic version (highest first), then by prefix priority
    candidates.sort((a, b) => {
        // Compare semantic versions
        const versionCompare = semver.rcompare(a.version, b.version)
        
        if (versionCompare !== 0) {
            return versionCompare
        }

        // If versions are equal, use prefix priority (production > staging)
        return TAG_PREFIXES.indexOf(a.prefix) - TAG_PREFIXES.indexOf(b.prefix)
    })

    return candidates[0].tag
}

export async function getVersion() {
    return getLatestTag()
        .then(tag => versionFromTag(tag))
        .catch(error => {
            console.error(
                `Could not find a version for ${PROJECT} (${error}) - no tags yet or no tags fetched? Using 0.0.0-dev`
            )
            return '0.0.0-dev'
        })
}

export async function generateBuildInfoHtml(outputPath) {
    const version = await getVersion()
    const timestamp = getTimestamp()
    const isCI = process.env.CI === 'true'

    let gitInfo = {}
    try {
        const branch = await getCurrentBranchName()
        const tags = await getTagsPointingAtHead()
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
        project: PROJECT,
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
