'use strict'
const { run } = require('react-snap')
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')

const outputPath = 'dist'
const outputPathAbs = path.join(__dirname, outputPath)

run({
  source: outputPath,
  include: ['/', '/create/'],
  skipThirdPartyRequests: true,
})
  .then(() => globby(path.join(outputPathAbs, '**/*.html')))
  .then(pagePaths =>
    Promise.all(
      pagePaths.map(pagePath =>
        fs.readFile(pagePath, 'utf8').then(page => {
          // convert filesystem path to URL relative path
          const relativePath =
            path
              .relative(path.dirname(pagePath), outputPathAbs)
              // split & join in case you have a Windows path
              .split(path.sep)
              .map(encodeURIComponent)
              .join('/') || '.'
          console.log(
            `PRERENDER: prefixing links in ${pagePath} with "${relativePath}/"`
          )
          const newPage = page
            .replace(/src="\/(?=[^/])/g, `src="${relativePath}/`)
            .replace(/link href="\/(?=[^/])/g, `link href="${relativePath}/`)

          return fs.writeFile(pagePath, newPage)
        })
      )
    )
  )
  .catch(console.error)
