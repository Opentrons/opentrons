'use strict'

const path = require('path')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const glob = require('glob')

const { baseConfig } = require('@opentrons/webpack-config')
// const {baseConfig, DEV_MODE} = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const JS_ENTRY = path.join(__dirname, './src/index.js')
const JS_PRERENDER_ENTRY = path.join(__dirname, './src/prerender.js')
const HTML_ENTRY = path.join(__dirname, './src/index.hbs')
const OUT_PATH = path.join(__dirname, 'dist')

const pages = [{ location: '', title: pkg.productName }]

// TODO(mc, 2019-04-05): uncommenting this block (and the imports above) will
//   statically prerender the labware detail pages, but build takes ~5 minutes.
//   Evaluate other solutions or isolate this build before release
// if (!DEV_MODE) {
//   glob
//     .sync(path.join(__dirname, '../shared-data/definitions2/*.json'))
//     .map(require)
//     .forEach(def =>
//       pages.push({
//         location: def.parameters.loadName,
//         title: `${def.metadata.displayName} | ${pkg.productName}`,
//       })
//     )
// }

// TODO(mc, 2019-03-13): we won't need to replace entry to avoid including
//   react-hot-loader/patch once monorepo is updated to react-hot-loader@4
module.exports = merge.strategy({ entry: 'replace' })(baseConfig, {
  entry: JS_ENTRY,

  output: {
    path: OUT_PATH,
  },

  plugins: pages.map(makeHtmlPlugin),
})

function makeHtmlPlugin(page) {
  const { location, title } = page

  return new HtmlWebpackPlugin({
    template: `!!handlebars-loader!prerender-loader?${JSON.stringify({
      entry: path.relative(__dirname, JS_PRERENDER_ENTRY),
      params: { location: `/${location}` },
    })}!${HTML_ENTRY}`,
    title: title,
    description: pkg.description,
    author: pkg.author.name,
    filename: path.join(location, 'index.html'),
  })
}
