'use strict'

// Determines versions for projects from git tags.
//
// A "project" is a coherent built application or applications that serve a purpose, that are versioned together.
// For instance, protocol-designer is a project; so is the robot stack for OT-2; so is the robot stack for OT-3.
// A project is made of packages in subdirectories of this monorepo. A version of a project is the the contents
// of the monorepo and the packages in the project at a specific git commit, pointed to by a specific git tag.
//
// That means that at any given git commit, the version of a package might be different depending on the project
// it's in. For instance, if you're looking at a commit that has in its history a tag for protocol-designer version
// 6.1.0, and a tag for labware-library 0.5.0, then that package is at both protocol-designer 6.1.0 (+some commits)
// and labware-library 0.5.0 (+some commits). A "version" only exists in context with the project it defines.
//
// What that all boils down to is that we need, and this module provides, an interface to get the version of a
// given project that currently exists in the monorepo.
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
    try {
        const branch = (
            await monorepoGit().raw(['rev-parse', '--abbrev-ref', 'HEAD'])
        ).trim()

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

            return ciBranch || null
        }

        return branch
    } catch (error) {
        // Try to get from environment as fallback
        return process.env.GITHUB_HEAD_REF ||
            process.env.GITHUB_REF_NAME ||
            process.env.CI_COMMIT_REF_NAME ||
            process.env.CIRCLE_BRANCH ||
            null
    }
}

export async function getShortSha() {
    try {
        const sha = (
            await monorepoGit().raw(['rev-parse', '--short', 'HEAD'])
        ).trim()
        return sha
    } catch (error) {
        return null
    }
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
    if (branchName) {
        // Use the full branch name with short SHA as the version
        const shortSha = await getShortSha()
        const versionString = shortSha ? `${branchName}-${shortSha}` : branchName
        // Return a synthetic tag format that can be parsed by detailsFromTag
        return `${prefixForProject(project)}${versionString}`
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
    const sha = await getShortSha()
    throw new Error(
        `No tags found at HEAD for project ${project} and no branch name available. ` +
        `SHA: ${sha || 'unknown'}, ` +
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
