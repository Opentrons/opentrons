// This build script is run by `make install`

// Merge all JSON files into a single JSON file, build/labware.json,
// with each filename as a key in the final JSON file.
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

  fs.writeFileSync(
    path.join(buildDir, 'labware.json'),
    jsonOutput
  )

//   fs.writeFileSync(
//     path.join(buildDir, 'labware.js'),
//     `// @flow
// import type {AllLabwareDefinitions} from '../js/types'
// const labwareDefinitions: AllLabwareDefinitions = ${jsonOutput}
// export default labwareDefinitions
// `
//   )
})
