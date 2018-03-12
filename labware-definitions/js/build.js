// This build script is run by `make install`
// TODO Ian 2018-03-12: use dynamic import of .json with webpackMode: "eager" ??

// Merge all JSON files into a single .js file, build/labware.js,
// with each filename as a key in the final JS object.
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const buildDir = 'build'
let output = {}

// Create build dir if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir)
}

glob(path.join(__dirname, '..', 'definitions', '*.json'), (error, files) => {
  if (error) {
    throw error
  }
  files.forEach((filename) => {
    const contents = JSON.parse(fs.readFileSync(filename, 'utf8'))
    const labwareName = path.parse(filename).name

    output[labwareName] = contents
  })

  const jsonOutput = JSON.stringify(output)

  // fs.writeFileSync(
  //   path.join(buildDir, 'labware.json'),
  //   jsonOutput
  // )

  fs.writeFileSync(
    path.join(buildDir, 'labware.js'),
    `// @flow
import type {AllLabwareDefinitions} from '../js/types'
const labwareDefinitions: AllLabwareDefinitions = ${jsonOutput}
export default labwareDefinitions
`
  )
})
