'use strict'

/* eslint-disable @typescript-eslint/explicit-function-return-type --
 * Plain JS module; explicit return types are enforced for TS sources only.
 */
/* eslint-disable @typescript-eslint/strict-boolean-expressions --
 * Untyped `tag` parameters in plain JS trip this rule for `string.startsWith`.
 */

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
const OT3_CALENDAR_TAG_RE = /^internal@\d{2}\.[1-9]\d?\.[1-9]\d?(?:\.(\d+))?$/

export function monorepoGit() {
  return git({ baseDir: REPO_BASE })
}

export const detailsFromTag = tag => {
  if (tag.startsWith('v')) {
    return ['robot-stack', tag.slice(1)]
  }
  if (tag.startsWith('internal@')) {
    return ['ot3', tag.slice('internal@'.length)]
  }
  if (tag.startsWith('ot3@')) {
    return ['ot3', tag.slice('ot3@'.length)]
  }
  if (tag.includes('@')) {
    const at = tag.indexOf('@')
    return [tag.slice(0, at), tag.slice(at + 1)]
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
  }
  if (project === 'ot3') {
    return 'internal@'
  }
  return `${project}@`
}

/** Glob passed to `git describe --match` for this project (single pattern). */
export function matchGlobForProject(project) {
  if (project === 'robot-stack') {
    return 'v*'
  }
  if (project === 'ot3') {
    return 'internal@*'
  }
  return `${project}@*`
}

export async function latestTagForProject(project) {
  if (project === 'ot3') {
    const tags = await monorepoGit().raw([
      'tag',
      '-l',
      'internal@*',
      '--merged',
      'HEAD',
      '--sort=-creatordate',
    ])
    const latestCalendarTag = tags
      .split('\n')
      .find(tag => OT3_CALENDAR_TAG_RE.test(tag))
    if (latestCalendarTag == null) {
      throw new Error('No OT3 calendar tag found')
    }
    return latestCalendarTag
  }
  return (
    await monorepoGit().raw([
      'describe',
      '--tags',
      '--abbrev=0',
      `--match=${matchGlobForProject(project)}`,
    ])
  ).trim()
}

export async function versionForProject(project) {
  try {
    const tag = await latestTagForProject(project)
    return detailsFromTag(tag)[1]
  } catch (error) {
    const errDetail = error instanceof Error ? error.message : String(error)
    console.error(
      `Could not find a version for project ${project} (${errDetail}) - no tags yet or no tags fetched? Using 0.0.0-dev`
    )
    return '0.0.0-dev'
  }
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
  // If _that_ doesn't exist, (i.e. because this is a fresh fork that has no releases yet) use edge
  const releaseTag = `v${appVersion}`
  const choreBranch = `origin/chore_release-${appVersion}`
  const labwareFiles = (
    await monorepoGit()
      .raw([...lstreeCmd, releaseTag, labwareDir])
      .catch(() => monorepoGit().raw([...lstreeCmd, choreBranch, labwareDir]))
      .catch(() => monorepoGit().raw([...lstreeCmd, 'origin/edge', labwareDir]))
  )
    .split('\0')
    .slice(0, -1) // git puts an extra '\0' at the end, remove it
    .map(filename => filename.replace(labwareDir, ''))
  // labwareFiles is a list like: ['agilent_1_reservoir_290ml/1.json', ...]

  // For each loadname in labwareFiles, return the highest labware version:
  return labwareFiles.reduce((acc, filename) => {
    const [loadName, jsonFilename] = filename.split('/')
    const labwareVersion = Number(jsonFilename.replace('.json', ''))
    if (acc[loadName] == null || labwareVersion > acc[loadName]) {
      acc[loadName] = labwareVersion
    }
    return acc
  }, {})
}
