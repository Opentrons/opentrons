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

export const detailsFromTag = tag =>
  tag.includes('@') ? tag.split('@') : ['robot-stack', tag.substring(1)]

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

/** Git tag glob for listing/describing versions of a project. */
export function tagGlobForProject(project) {
  const prefix = prefixForProject(project)
  if (project === 'robot-stack') {
    // Require major.minor shape; excludes mistagged names like vacuum-module-qc-*.
    return `${prefix}[0-9]*.[0-9]*`
  }
  return `${prefix}*`
}

export async function latestTagForProject(project) {
  return (
    await monorepoGit().raw([
      'describe',
      '--tags',
      '--abbrev=0',
      `--match=${tagGlobForProject(project)}`,
    ])
  ).trim()
}

export async function versionForProject(project) {
  return latestTagForProject(project)
    .then(tag => detailsFromTag(tag)[1])
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

async function gitRaw(args) {
  try {
    return (await monorepoGit().raw(args)).trim()
  } catch (error) {
    console.error(
      `Could not get git build details: git ${args.join(' ')} failed:`,
      error
    )
    return undefined
  }
}

/** Short hash and branch name for tracking in the ODD */
export async function getGitBuildDetails() {
  const commitHash = (await gitRaw(['rev-parse', '--short', 'HEAD'])) ?? ''

  // Backup environment variables set by CI
  const branchName =
    (await gitRaw(['branch', '--show-current'])) ??
    process.env.GITHUB_HEAD_REF ??
    process.env.GITHUB_REF_NAME ??
    ''

  return { commitHash, branchName }
}
