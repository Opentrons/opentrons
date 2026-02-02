'use strict'

const fs = require('fs/promises')

// Updates a releases historical manifest with a release's version.

/**
 * Parses an argument list into positional arguments and flags
 * @param {string[]} argv - argument list
 * @returns {{flags: string[], args: string[]}} Lists of flags and strings
 */
function parseArgs(argv) {
  return {
    flags: argv.filter(a => a.startsWith('-')),
    args: argv.filter(a => !a.startsWith('-')),
  }
}

const USAGE =
  '\nUsage:\n node ./scripts/update-releases-json <releases-json-path> <project> <artifact-dir> <url-base>'

async function readOrDefaultReleases(releasesPath) {
  try {
    const releasesFile = await fs.readFile(releasesPath)
    return JSON.parse(releasesFile)
  } catch (error) {
    console.log(`Could not read releases file: ${error}, defaulting`)
    return { production: {} }
  }
}

const FILES_IN_RELEASE_JSON = [
  /Opentrons-OT2.*\.exe$/,
  /Opentrons-OT2.*\.dmg$/,
  /Opentrons-OT2.*\.AppImage$/,
  /latest.*yml$/,
  /alpha.*yml$/,
  /beta.*yml$/,
]

function artifactNameToObj(artifactName, urlBase) {
  if (artifactName.search(/Opentrons-OT2.*\.exe$/) !== -1) {
    return { 'Opentrons-OT2.exe': urlBase + artifactName }
  } else if (artifactName.search(/Opentrons-OT2.*\.dmg$/) !== -1) {
    return { 'Opentrons-OT2.dmg': urlBase + artifactName }
  } else if (artifactName.search(/Opentrons-OT2.*\.AppImage$/) !== -1) {
    return { 'Opentrons-OT2.AppImage': urlBase + artifactName }
  } else if (artifactName.search(/(latest|alpha|beta).*yml$/) !== -1) {
    return { [artifactName]: urlBase + artifactName }
  } else {
    throw new Error(`Unmatched artifact ${artifactName}`)
  }
}

async function artifactsFromDir(artifactDirPath, urlBase) {
  const files = await fs.readdir(artifactDirPath, { withFileTypes: true })
  return files
    .filter(
      dirent =>
        dirent.isFile() &&
        FILES_IN_RELEASE_JSON.some(re => dirent.name.search(re) !== -1)
    )
    .map(dirent => artifactNameToObj(dirent.name, urlBase))
    .reduce((prev, current) => ({ ...prev, ...current }), {})
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2))
  const [releasesPath, project, artifactDirPath, urlBase] = args
  if (!releasesPath || !project || !artifactDirPath || !urlBase) {
    throw new Error(USAGE)
  }
  console.log(`Updating ${releasesPath} with artifacts from ${artifactDirPath}`)
  const releasesData = await readOrDefaultReleases(releasesPath)
  const versionFinder = await import('./git-version.mjs')
  const version = await versionFinder.versionForProject(project)
  console.log(`Adding data for ${version}`)
  releasesData.production[version] = {
    ...(await artifactsFromDir(
      artifactDirPath,
      urlBase.endsWith('/') ? urlBase : `${urlBase}/`
    )),
    revoked: false,
  }
  console.log(
    `Added ${Object.keys(releasesData.production[version]).length} artifacts`
  )
  ;(await fs.open(releasesPath, 'w')).writeFile(JSON.stringify(releasesData))
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('release file updated')
    })
    .catch(error => {
      console.error('Release file update failed:', error.message)
      process.exitCode = -1
    })
}
