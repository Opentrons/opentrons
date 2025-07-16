'use strict'

const fs = require('fs/promises')

// Updates a releases historical manifest with a release's version.

const parseArgs = require('./deploy/lib/parseArgs')
const USAGE =
  '\nUsage:\n node ./scripts/update-releases-json <releases-json-path> <project> <artifact-dir> <url-base>'

async function readOrDefaultReleases(releasesPath) {
  console.log(`Reading releases file from: ${releasesPath}`)
  try {
    const releasesFile = await fs.readFile(releasesPath)
    const releases = JSON.parse(releasesFile)
    console.log(
      `Successfully loaded existing releases file with ${
        Object.keys(releases.production || {}).length
      } versions`
    )
    return releases
  } catch (error) {
    console.log(
      `Could not read releases file: ${error}, defaulting to empty structure`
    )
    return { production: {} }
  }
}

const FILES_IN_RELEASE_JSON = [
  /Opentrons.*\.exe$/,
  /Opentrons.*\.dmg$/,
  /Opentrons.*\.AppImage$/,
  /latest.*yml$/,
  /alpha.*yml$/,
  /beta.*yml$/,
]

function artifactNameToObj(artifactName, urlBase) {
  if (artifactName.search(/Opentrons.*\.exe$/) !== -1) {
    return { 'Opentrons.exe': urlBase + artifactName }
  } else if (artifactName.search(/Opentrons.*\.dmg$/) !== -1) {
    return { 'Opentrons.dmg': urlBase + artifactName }
  } else if (artifactName.search(/Opentrons.*\.AppImage$/) !== -1) {
    return { 'Opentrons.AppImage': urlBase + artifactName }
  } else if (artifactName.search(/(latest|alpha|beta).*yml$/) !== -1) {
    return { [artifactName]: urlBase + artifactName }
  } else {
    throw new Error(`Unmatched artifact ${artifactName}`)
  }
}

async function artifactsFromDir(artifactDirPath, urlBase) {
  console.log(`Scanning artifact directory: ${artifactDirPath}`)
  const files = await fs.readdir(artifactDirPath, { withFileTypes: true })
  console.log(
    `Found ${files.filter(f => f.isFile()).length} files in directory`
  )

  const filteredFiles = files.filter(
    dirent =>
      dirent.isFile() &&
      FILES_IN_RELEASE_JSON.some(re => dirent.name.search(re) !== -1)
  )

  console.log(`Matched ${filteredFiles.length} files against release patterns:`)
  filteredFiles.forEach(file => {
    console.log(`  - ${file.name}`)
  })

  return filteredFiles
    .map(dirent => {
      const artifact = artifactNameToObj(dirent.name, urlBase)
      console.log(`  Mapped ${dirent.name} -> ${JSON.stringify(artifact)}`)
      return artifact
    })
    .reduce((prev, current) => ({ ...prev, ...current }), {})
}

async function main() {
  const { args } = parseArgs(process.argv.slice(2))
  const [releasesPath, project, artifactDirPath, urlBase] = args

  console.log('=== Update Releases JSON Script ===')
  console.log(`Arguments:`)
  console.log(`  - Releases path: ${releasesPath}`)
  console.log(`  - Project: ${project}`)
  console.log(`  - Artifact directory: ${artifactDirPath}`)
  console.log(`  - URL base: ${urlBase}`)
  console.log('')

  if (!releasesPath || !project || !artifactDirPath || !urlBase) {
    throw new Error(USAGE)
  }
  console.log(`Updating ${releasesPath} with artifacts from ${artifactDirPath}`)
  const releasesData = await readOrDefaultReleases(releasesPath)
  console.log(`Getting version for project: ${project}`)
  const versionFinder = await import('./git-version.mjs')
  const version = await versionFinder.versionForProject(project)
  console.log(`Adding data for ${version}`)

  console.log(
    `Processing artifacts with URL base: ${
      urlBase.endsWith('/') ? urlBase : `${urlBase}/`
    }`
  )
  const artifacts = await artifactsFromDir(
    artifactDirPath,
    urlBase.endsWith('/') ? urlBase : `${urlBase}/`
  )

  releasesData.production[version] = {
    ...artifacts,
    revoked: false,
  }
  console.log(
    `Added ${
      Object.keys(releasesData.production[version]).length
    } artifacts for version ${version}`
  )
  console.log('Final artifact data:')
  console.log(JSON.stringify(releasesData.production[version], null, 2))

  console.log(`Writing updated data to: ${releasesPath}`)
  ;(await fs.open(releasesPath, 'w')).writeFile(JSON.stringify(releasesData))
  console.log('Release file written successfully')
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
