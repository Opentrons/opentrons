'use strict'
// Use react-snap to crawl from the specified URL paths and prerender HTML for those pages.
// Since paths to JS/CSS assets are relative to webpack publicPath, and not relative to
// the location of the page being prerendered, those src/href paths need to be prefixed with
// the correct number of `../`'s to reference the project root.
//
// For example, the output of react-snap for a page at http://localhost:PORT/path/to/page/
// will have a <script src="/bundle.js"/> (webpack publicPath is `/`). But it should have
// the path: <script src="../../../bundle.js"/> to point to the bundle.js at the project root.
//
// React-snap does not yet support this, see https://github.com/stereobooster/react-snap/issues/397
// so we will re-parse the HTML files and replace their URLs with relative ones.
const path = require('path')
const { run } = require('react-snap')
const fs = require('fs-extra')
const globby = require('globby')
const rehype = require('rehype')
const rehypeUrls = require('rehype-urls')

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
              .join('/') || '.'

          const relativizeUrl = url => {
            if (url.host) {
              return url.href
            } else {
              return `${relativePath}${url.path}`
            }
          }

          return rehype()
            .use(rehypeUrls, relativizeUrl)
            .process(page)
            .then(newPageVFile => {
              console.log(
                `PRERENDER: prefixing links in ${pagePath} with "${relativePath}/"`
              )
              return fs.writeFile(pagePath, newPageVFile.contents)
            })
        })
      )
    )
  )
  .catch(console.error)
