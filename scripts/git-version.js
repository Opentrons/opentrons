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

const git = require('simple-git')
const { dirname } = require('path')
const REPO_BASE = dirname(__dirname)

function monorepoGit() {
  return git({ baseDir: REPO_BASE })
}

const detailsFromTag = tag =>
  tag.includes('@') ? tag.split('@') : ['robot-stack', tag.substring(1)]

function tagFromDetails(project, version) {
  const prefix = prefixForProject(project)
  return `${prefix}${version}`
}

function prefixForProject(project) {
  if (project === 'robot-stack') {
    return 'v'
  } else {
    return `${project}@`
  }
}

async function latestTagForProject(project) {
  return (
    await monorepoGit().raw([
      'describe',
      '--tags',
      '--abbrev=0',
      `--match=${prefixForProject(project)}*`,
    ])
  ).trim()
}

async function versionForProject(project) {
  return latestTagForProject(project)
    .then(tag => detailsFromTag(tag)[1])
    .catch(error => {
      console.error(
        `Could not find a version for project ${project} (${error}) - no tags yet or no tags fetched? Using 0.0.0-dev`
      )
      return '0.0.0-dev'
    })
}

module.exports = {
  detailsFromTag,
  tagFromDetails,
  prefixForProject,
  latestTagForProject,
  versionForProject,
  monorepoGit,
}
