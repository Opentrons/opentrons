// determine a project's version from git and write it to its package manifest
// only depends on Node built-in libraries for easy use in GitHub actions
// TODO(mc, 2020-10-02): add pyproject.toml support
'use strict'

const fs = require('fs').promises
const path = require('path')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const USAGE = `
write-versions-from-git.js

CLI usage:
> node scripts/write-versions-from-git.js [--dryrun] [--reset] [--help]

API usage:
> require('./scripts/write-versions-from-git')(options)

This script determines a project's version using git tags and writes
that version to the project's manifest (package.json, pyproject.toml).

You may specify three options:

- dryrun: print changes to console but do not write them
- reset: reset versions to the placeholder "0.0.0-dev"
- help: print this usage text

If the commit matches a tag, then the version written will match the tag.
Otherwise, the version will be:

"{next_version}-snapshot.{commits_since_tag}-{commit_sha}"

- {next_version} is the current version incremented by:
  - The minor version if the last tag was not a prerelease
  - The prerelease version if the last tag was a prerelease
- {commits_since_tag} and {commit_sha} are from git describe

Examples:

- 1.0.0         ->  1.1.0-dev.12+7942c0e08
- 2.2.4         ->  2.3.0-dev.31+55daec2c6
- 3.0.0-beta.3  ->  3.0.0-beta.4-dev.1+bc625168e
`

// TODO(mc, 2020-10-02): pull from filesystem somehow? this information
// is redundant with other sources of truth in the repository
const PROJECTS = [
  {
    name: '@opentrons/api-server',
    manifestPath: 'api/src/opentrons/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/app',
    manifestPath: 'app/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/app-shell',
    manifestPath: 'app-shell/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/components',
    manifestPath: 'components/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/discovery-client',
    manifestPath: 'discovery-client/package.json',
    tagPrefix: null,
  },
  {
    name: 'labware-designer',
    manifestPath: 'labware-designer/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/labware-library',
    manifestPath: 'labware-library/package.json',
    tagPrefix: 'labware-library@',
  },
  {
    name: 'protocol-designer',
    manifestPath: 'protocol-designer/package.json',
    tagPrefix: 'protocol-designer@',
  },
  {
    name: 'protocol-library-kludge',
    manifestPath: 'protocol-library-kludge/package.json',
    tagPrefix: 'protocol-designer@',
  },
  {
    name: '@opentrons/robot-server',
    manifestPath: 'robot-server/robot_server/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/shared-data',
    manifestPath: 'shared-data/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/update-server',
    manifestPath: 'update-server/otupdate/package.json',
    tagPrefix: null,
  },
  {
    name: '@opentrons/webpack-config',
    manifestPath: 'webpack-config/package.json',
    tagPrefix: null,
  },
]

const DEFAULT_PREFIX = 'v'
const DEFAULT_VERSION = '0.0.0-dev'
// TODO(mc, 2020-10-02): support toml
const RE_CURRENT_VERSION = /"version": "([a-z0-9.-]+)"/
const RE_DESCRIBE_VERSION = new RegExp(
  [
    // capture major (1), minor (2), and patch (3)
    `(\\d+)\\.(\\d+)\\.(\\d+)`,
    // capture optional prerelease identifier (4) and prerelease number (5)
    `(?:-([a-z]+)\\.(\\d+))?`,
    // capture optional count since last commit (6) and git sha (7)
    `(?:-(\\d+)-g([a-z0-9]+))?`,
  ].join('')
)

// TODO(mc, 2020-10-02): support toml
const getDepVersionMatcher = depName => new RegExp(`"${depName}": ".+"`, 'g')

const getFilename = ({ manifestPath }) =>
  path.join(__dirname, '..', manifestPath)

const Manifest = (
  name,
  manifestPath,
  tagPrefix,
  contents,
  nextVersion = null,
  nextContents = null
) => ({
  name,
  manifestPath,
  tagPrefix,
  contents,
  nextVersion,
  nextContents,
})

function writeVersionsFromGit(options = {}) {
  const { dryrun = false, reset = false, help = false } = options

  if (help) {
    console.log(USAGE)
    return Promise.resolve(0)
  }

  const parseTasks = PROJECTS.map(readManifest)

  return Promise.all(parseTasks)
    .then(manifests => {
      const versionTasks = manifests.map(addNextVersionFromGit)
      return Promise.all(versionTasks)
    })
    .then(manifests => {
      const writeTasks = manifests.map(m => {
        const updatedManifest = updateManifestVersions(m, manifests)
        return writeManifest(updatedManifest)
      })

      return Promise.all(writeTasks)
    })
    .then(() => {
      console.log('All projects updated')
      return 0
    })
    .catch(error => {
      console.error(error)
      return 1
    })

  function readManifest(project) {
    const { name, manifestPath, tagPrefix } = project

    return fs.readFile(getFilename(project), 'utf8').then(contents => {
      return Manifest(name, manifestPath, tagPrefix, contents)
    })
  }

  function addNextVersionFromGit(manifest) {
    const { tagPrefix } = manifest
    const prefix = tagPrefix === null ? DEFAULT_PREFIX : manifest.tagPrefix
    const match = `${prefix}*`

    if (reset) {
      return { ...manifest, nextVersion: DEFAULT_VERSION }
    }

    return exec(`git describe --match ${match}`).then(({ stdout }) => {
      const gitVersion = stdout.trim().slice(prefix.length)
      const gitVersionParts = gitVersion.match(RE_DESCRIBE_VERSION)
      const [, maj, min, patch, preId, preN, commitN, sha] = gitVersionParts
      let nextVersion = gitVersion

      if (sha) {
        const nextVersionBase = preId
          ? `${maj}.${min}.${patch}-${preId}.${Number(preN) + 1}`
          : `${maj}.${Number(min) + 1}.0`

        nextVersion = `${nextVersionBase}-dev.${commitN}+${sha}`
      }

      return { ...manifest, nextVersion }
    })
  }

  function updateManifestVersions(manifest, allManifests) {
    const { contents, nextVersion } = manifest
    let nextContents = contents.replace(
      RE_CURRENT_VERSION,
      `"version": "${nextVersion}"`
    )

    allManifests.forEach(({ name: depName, nextVersion: depVersion }) => {
      nextContents = nextContents.replace(
        getDepVersionMatcher(depName),
        `"${depName}": "${depVersion}"`
      )
    })

    return { ...manifest, nextContents }
  }

  function writeManifest(manifest) {
    const { name, manifestPath, nextVersion, nextContents } = manifest

    console.log(`Updating ${name} with ${nextVersion}`)

    if (!dryrun) {
      return fs
        .writeFile(getFilename(manifest), nextContents)
        .then(() => console.log(`Wrote ${manifestPath}`))
    }

    console.log('DRYRUN:', manifestPath, nextContents)
  }
}

if (require.main === module) {
  const argv = process.argv.slice(2)
  const dryrun = argv.includes('--dryrun')
  const reset = argv.includes('--reset')
  const help = argv.includes('--help')

  writeVersionsFromGit({ dryrun, reset, help }).then(
    exitCode => (process.exitCode = exitCode)
  )
}

module.exports = writeVersionsFromGit
