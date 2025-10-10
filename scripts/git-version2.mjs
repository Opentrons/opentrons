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

// Parse a semver-like version string into comparable parts
export function parseSemver(versionString) {
  // Match pattern like: 8.6.0-alpha.1 or 1.2.3 or 8.6.0-branch
  const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
  if (!match) {
    // If it doesn't match semver, return a low priority object
    return { major: 0, minor: 0, patch: 0, prerelease: versionString, valid: false }
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
    valid: true
  }
}

// Compare two semver objects, returns 1 if a > b, -1 if a < b, 0 if equal
export function compareSemver(a, b) {
  // Invalid versions are always less than valid ones
  if (!a.valid && b.valid) return -1
  if (a.valid && !b.valid) return 1
  if (!a.valid && !b.valid) return a.prerelease.localeCompare(b.prerelease)
  
  // Compare major.minor.patch
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  
  // If one has prerelease and the other doesn't, the one without is greater
  if (a.prerelease && !b.prerelease) return -1
  if (!a.prerelease && b.prerelease) return 1
  
  // Both have prereleases, compare them lexicographically
  return a.prerelease.localeCompare(b.prerelease)
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
    return branch === 'HEAD' ? null : branch
  } catch (error) {
    return null
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
            semver: parseSemver(version)
          }
        })
        
        // Sort by semver (highest first)
        taggedVersions.sort((a, b) => compareSemver(b.semver, a.semver))
        
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
  
  // No tags at HEAD and no branch, throw error
  throw new Error(`No tags found at HEAD for project ${project} and no branch name available`)
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
