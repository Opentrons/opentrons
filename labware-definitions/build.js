// Merge all JSON files into a single file, build/labware.json,
// with each filename as a key in the final JSON.
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const buildDir = 'build'
let output = {}

// Create build dir if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir)
}

glob('definitions/*.json', (error, files) => {
  if (error) {
    throw error
  }
  files.forEach((filename) => {
    const contents = JSON.parse(fs.readFileSync(filename, 'utf8'))
    const labwareName = path.parse(filename).name

    output[labwareName] = contents
  })

  fs.writeFileSync(
    path.join(buildDir, 'labware.json'),
    JSON.stringify(output)
  )
})
