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

"{next_version}-dev.{commits_since_tag}+{commit_sha}"

- {next_version} is the current version incremented by:
  - The minor version if the last tag was not a prerelease
  - The prerelease version if the last tag was a prerelease
- {commits_since_tag} and {commit_sha} are from git describe

Examples:

- 1.0.0         ->  1.1.0-dev.12+7942c0e08
- 2.2.4         ->  2.3.0-dev.31+55daec2c6
- 3.0.0-beta.3  ->  3.0.0-beta.4-dev.1+bc625168e
`

// TODO(mc, 2020-10-05): this will require rethinking if/when Python projects
// stop using package.json for versioning, which will be a good thing to do
const { workspaces } = require('../package.json')

const DEFAULT_VERSION = '0.0.0-dev'
const PACKAGE_JSON_DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]

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

  const parseTasks = workspaces.map(readPackageJson)

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

  function readPackageJson(projectPath) {
    const manifestPath = path.join(projectPath, './package.json')
    const packageAbsPath = path.join(__dirname, '..', manifestPath)

    return fs.readFile(packageAbsPath, 'utf8').then(fileContents => {
      const contents = JSON.parse(fileContents)
      const { name, config } = contents
      const tagPrefix = config.versionTagPrefix

      return Manifest(name, manifestPath, tagPrefix, contents)
    })
  }

  function addNextVersionFromGit(manifest) {
    const { tagPrefix } = manifest
    const match = `${tagPrefix}*`

    if (reset) {
      return { ...manifest, nextVersion: DEFAULT_VERSION }
    }

    return exec(`git describe --match ${match}`).then(({ stdout }) => {
      const gitVersion = stdout.trim().slice(tagPrefix.length)
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
    let nextContents = { ...contents, version: nextVersion }

    allManifests.forEach(({ name: depName, nextVersion: depVersion }) => {
      PACKAGE_JSON_DEP_SECTIONS.forEach(sectionName => {
        const section = nextContents[sectionName]
        if (section && depName in section) {
          nextContents = {
            ...nextContents,
            [sectionName]: { ...section, [depName]: depVersion },
          }
        }
      })
    })

    return { ...manifest, nextContents }
  }

  function writeManifest(manifest) {
    const { name, manifestPath, nextVersion, nextContents } = manifest
    const nextFileContents = `${JSON.stringify(nextContents, null, 2)}\n`
    console.log(`Updating ${name} with ${nextVersion}`)

    if (!dryrun) {
      return fs
        .writeFile(getFilename(manifest), nextFileContents)
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
