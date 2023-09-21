'use strict'

const fs = require('fs/promises')

// Updates a releases historical manifest with a release's version.

const versionFinder = require('./git-version')

const parseArgs = require('./deploy/lib/parseArgs')
const USAGE = '\nUsage:\n node ./scripts/update-releases-json <releases-json-path> <project> <artifact-dir>'

async function readOrDefaultReleases(releasesPath) {
  try {
    const releasesFile = await fs.readFile(releasesPath)
    return JSON.parse(releasesFile)
  } catch(error) {
    console.log(`Could not read releases file: ${error}, defaulting`)
    return {production: {}}
  }
}

const FILES_IN_RELEASE_JSON = [
  /Opentrons.*\.exe$/,
  /Opentrons.*\.dmg$/,
  /Opentrons.*\.AppImage$/,
  /latest.*yml$/,
  /alpha.*yml$/,
  /beta.*yml$/
]

function artifactNameToObj(artifactName) {
  if (artifactName.search(/Opentrons.*\.exe$/) !== -1) {
    return {'Opentrons.exe': artifactName}
  } else if (artifactName.search(/Opentrons.*\.dmg$/) !== -1) {
    return {'Opentrons.dmg': artifactName}
  } else if (artifactName.search(/Opentrons.*\.AppImage$/) !== -1) {
    return {'Opentrons.AppImage': artifactName}
  } else if (artifactName.search(/(latest|alpha|beta).*yml$/) !== -1) {
    return {[artifactName]: artifactName}
  } else {
    throw new Error(`Unmatched artifact ${artifactName}`)
  }
}

async function artifactsFromDir(artifactDirPath) {
  const files = await fs.readdir(artifactDirPath, {withFileTypes: true})
  return files.filter(dirent => dirent.isFile() && FILES_IN_RELEASE_JSON.some(re => dirent.name.search(re) !== -1))
      .map(dirent => artifactNameToObj(dirent.name))
      .reduce((prev, current) => ({...prev, ...current}))
}

async function main() {
  const {args}= parseArgs(process.argv.slice(2))
  const [releasesPath, project, artifactDirPath] = args
  if (!releasesPath || !project || !artifactDirPath) {
    throw new Error(USAGE)
  }
  const releasesData = await readOrDefaultReleases(releasesPath)
  const version = await versionFinder.versionForProject(project)
  releasesData.production[version] = {...(await artifactsFromDir(artifactDirPath)), revoked: false} ;

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
