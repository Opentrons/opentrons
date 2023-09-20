'use strict'

const fs = require('fs/promises')

// Updates a releases historical manifest with a release's version.

const versionFinder = require('./git-version')

const parseArgs = require('./deploy/lib/parseArgs')
const USAGE = '\nUsage:\n node ./scripts/update-releases-json <releases-json-path> <project> <windows-path> <mac-path> <linux-path>'

async function readOrDefaultReleases(releasesPath) {
  try {
    const releasesFile = await fs.readFile(releasesPath)
    return JSON.parse(releasesFile)
  } catch(error) {
    console.log(`Could not read releases file: ${error}, defaulting`)
    return {production: {}}
  }
}

async function main() {
  const {args}= parseArgs(process.argv.slice(2))
  const [releasesPath, project, windowsPath, macPath, linuxPath] = args
  if (!releasesPath || !project || !windowsPath || !macPath || !linuxPath) {
    throw new Error(USAGE)
  }
  const releasesData = await readOrDefaultReleases(releasesPath)
  const version = await versionFinder.versionForProject(project)
  releasesData.production[version] = {
    'Opentrons.exe': windowsPath,
    'Opentrons.dmg': macPath,
    'Opentrons.AppImage': linuxPath,
    revoked: false
  } ;
  (await fs.open(releasesPath, 'w')).writeFile(JSON.stringify(releasesData))
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('release file updated')
    })
    .catch(error => {
      console.error('Release file update failed:', error)
      process.exitCode = -1
    })
}
