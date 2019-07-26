'use strict'
const { run } = require('react-snap')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const outputPath = 'dist'
const outputPathAbs = path.join(__dirname, outputPath)

run({
  source: outputPath,
  include: ['/', '/create/'],
})
  .then(() => {
    const pages = glob.sync(path.join(outputPathAbs, '**', '*.html'))
    pages.forEach(pagePath => {
      const page = fs.readFileSync(pagePath, 'utf8')
      const relativePath =
        path
          .relative(path.dirname(pagePath), outputPathAbs)
          // if on windows, \ -> / for url paths (untested)
          .replace('\\', '/') || '.'
      console.log({ pagePath, relativePath })
      const newPage = page
        .replace(/src="\//g, `src="${relativePath}/`)
        .replace(/link href="\//g, `link href="${relativePath}/`)
      fs.writeFileSync(pagePath, newPage)
    })
  })
  .catch(console.error)
