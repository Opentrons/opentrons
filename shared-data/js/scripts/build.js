// This build script is run by `make install`

// Merge all JSON files into a single JSON labware file, build/labware.json,
// and a single JSON decks file, build/decks.json
// with each filename as a key in the final JSON file.
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const buildDir = process.argv[2]

if (!buildDir) {
  throw new Error(
    'build.js requires a build directory given as an argument. eg `node js/scripts/build.js path/to/build/`'
  )
}

const globifySourceFiles = sourcePath => {
  let output = {}

  const files = glob.sync(path.join(__dirname, sourcePath))

  files.forEach(filename => {
    const contents = require(filename)
    const labwareName = path.parse(filename).name

    output[labwareName] = contents
  })

  return JSON.stringify(output)
}

const labwareSourcePath = '../../definitions/*.json'
const decksSourcePath = '../../robot-data/decks/*.json'

fs.writeFileSync(path.join(buildDir, 'labware.json'), globifySourceFiles(labwareSourcePath))
fs.writeFileSync(path.join(buildDir, 'decks.json'), globifySourceFiles(decksSourcePath))
