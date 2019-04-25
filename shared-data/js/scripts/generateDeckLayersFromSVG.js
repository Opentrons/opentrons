const fs = require('fs')
const path = require('path')
const JSDOM = require('jsdom').JSDOM

// This script expects two args: the path of the source svg, and the desired
// destination directory of the output json.
// NOTE: the expected source SVG is an output SVG from Adobe Illustrator
// when using `Save as` or `Save as a Copy` and not `Export`
// Furthermore, the .ai file should contain no groups and all layers
// will be directly translated to layer groups in the JSON output

const svgPath = process.argv[2]
const buildDir = process.argv[3]

if (!buildDir) {
  throw new Error(
    'generateDeckLayersFromSVG requires a build directory given as an argument. eg `node js/scripts/build.js path/to/svg/ path/to/build/`'
  )
}

fs.readFile(svgPath, (err, data) => {
  if (err || !data) {
    console.error('SVG file could not be read')
  }
  const doc = new JSDOM(data.toString(), 'text/xml')

  const groups = Array.from(doc.window.document.querySelectorAll('g'))

  let layers = {}
  groups.forEach(g => {
    const groupId = g.getAttribute('id')
    if (groupId && g.hasChildNodes()) {
      const features = Array.from(g.querySelectorAll('path'))
      const paths = features.map(f => ({
        footprint: f.getAttribute('d').replace(/\s|  {2}|\r\n|\n|\r/gm, ''), // clean up whitespaces and newlines
      }))
      layers = { ...layers, [groupId]: paths }
    }
  })

  const jsonOutput = JSON.stringify(layers)

  fs.writeFileSync(path.join(buildDir, 'deckLayers.json'), jsonOutput)
})
