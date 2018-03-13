// This build script is run by `make install`

// Merge all JSON files into a single JSON file, build/labware.json,
// with each filename as a key in the final JSON file.
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const buildDir = process.argv[2]

let buildDirIsValidDir = false
try {
  buildDirIsValidDir = fs.statSync(buildDir).isDirectory()
} catch (e) {}

if (!buildDirIsValidDir) {
  throw new Error('build.js requires a build directory argument. "' + buildDir + '" is not a directory.')
}

let output = {}

const files = glob.sync(path.join(__dirname, '../../definitions/*.json'))

files.forEach((filename) => {
  const contents = require(filename)
  const labwareName = path.parse(filename).name

  output[labwareName] = contents
})

const jsonOutput = JSON.stringify(output)

fs.writeFileSync(
  path.join(buildDir, 'labware.json'),
  jsonOutput
)
