'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
// const glob = require('glob')

const { baseConfig } = require('@opentrons/webpack-config')
// const {baseConfig, DEV_MODE} = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const JS_ENTRY = path.join(__dirname, './src/index.js')
const JS_PRERENDER_ENTRY = path.join(__dirname, './src/prerender.js')
const HTML_ENTRY = path.join(__dirname, './src/index.hbs')
const OUT_PATH = path.join(__dirname, 'dist')

const pages = [
  { location: '', title: pkg.productName },
  { location: 'create', title: 'Labware Creator' },
]

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

const LABWARE_LIBRARY_ENV_VAR_PREFIX = 'OT_LL'

module.exports = merge(baseConfig, {
  entry: JS_ENTRY,

  output: {
    path: OUT_PATH,
  },

  plugins: [
    ...pages.map(makeHtmlPlugin),
    new webpack.EnvironmentPlugin(
      Object.keys(process.env)
        .filter(v => v.startsWith(LABWARE_LIBRARY_ENV_VAR_PREFIX))
        .concat(['NODE_ENV'])
    ),

    new FaviconsWebpackPlugin({
      logo: './src/images/favicon-logo.png',
      prefix: 'icons-[hash]/',
      inject: true,
      background: '#fff',
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        windows: false,
        yandex: false,
      },
    }),
  ],
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
    gtmId: process.env.GTM_ID,
  })
}
