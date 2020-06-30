const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const camelCase = require('lodash/camelCase')
const JSDOM = require('jsdom').JSDOM
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

// NOTE: the expected source SVG is an output SVG from Adobe Illustrator
// when using `Save as` or `Save as a Copy` and not `Export`
// Furthermore, the .ai file should contain no groups and all layers
// will be directly translated to layer groups in the JSON output

const svgPath = process.argv[2]
const buildDir = process.argv[3]

const USAGE =
  'Expected Params Not Present:   (e.g. node ./scripts/generateDeckLayersFromSVG ./path/to/source/svg ./path/to/output/dir)'
assert(svgPath && buildDir, USAGE)

readFile(svgPath, 'utf8')
  .then(data => {
    const doc = new JSDOM(data, 'text/xml')
    const groups = Array.from(doc.window.document.querySelectorAll('g'))

    let layers = {}
    groups.forEach(g => {
      const groupId = g.getAttribute('id')
      if (groupId && g.hasChildNodes()) {
        const features = Array.from(g.querySelectorAll('path'))
        const paths = features.map(f => ({
          footprint: f.getAttribute('d').replace(/\s|  {2}|\r\n|\n|\r/gm, ''), // clean up whitespaces and newlines
        }))
        layers = { ...layers, [camelCase(groupId)]: paths }
      }
    })

    const jsonOutput = JSON.stringify(layers)
    return writeFile(path.join(buildDir, 'deckLayers.json'), jsonOutput)
  })
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
