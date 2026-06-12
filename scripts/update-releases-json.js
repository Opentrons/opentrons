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

// Robot-stack installers use Opentrons OT-2-*; internal builds use Opentrons Internal OT-2-*.
const OT2_INSTALLER_RE = /Opentrons(?: Internal)? OT-2.*\.(exe|dmg|AppImage)$/i

const FILES_IN_RELEASE_JSON = [
  OT2_INSTALLER_RE,
  /latest.*yml$/,
  /alpha.*yml$/,
  /beta.*yml$/,
]

// Shared electron-updater feeds at the app deploy root (same URLs for every version entry).
const APP_CHANNEL_UPDATE_YMLS = [
  'latest.yml',
  'latest-mac.yml',
  'latest-linux.yml',
  'alpha.yml',
  'alpha-mac.yml',
  'alpha-linux.yml',
  'beta.yml',
  'beta-mac.yml',
  'beta-linux.yml',
]

function channelUpdateManifestUrls(urlBase) {
  return Object.fromEntries(
    APP_CHANNEL_UPDATE_YMLS.map(name => [name, urlBase + name])
  )
}

function installerManifestKeys(artifactName) {
  const isInternal = /Opentrons Internal OT-2/i.test(artifactName)
  const prefix = isInternal ? 'Opentrons Internal OT-2' : 'Opentrons OT-2'
  return {
    exe: `${prefix}.exe`,
    dmg: `${prefix}.dmg`,
    appimage: `${prefix}.AppImage`,
  }
}

function artifactNameToObj(artifactName, urlBase) {
  const k = installerManifestKeys(artifactName)
  if (artifactName.search(/Opentrons(?: Internal)? OT-2.*\.exe$/i) !== -1) {
    return { [k.exe]: urlBase + artifactName }
  } else if (
    artifactName.search(/Opentrons(?: Internal)? OT-2.*\.dmg$/i) !== -1
  ) {
    return { [k.dmg]: urlBase + artifactName }
  } else if (
    artifactName.search(/Opentrons(?: Internal)? OT-2.*\.AppImage$/i) !== -1
  ) {
    return { [k.appimage]: urlBase + artifactName }
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
  const normalizedUrlBase = urlBase.endsWith('/') ? urlBase : `${urlBase}/`
  releasesData.production[version] = {
    ...channelUpdateManifestUrls(normalizedUrlBase),
    ...(await artifactsFromDir(artifactDirPath, normalizedUrlBase)),
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
