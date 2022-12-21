'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { DefinePlugin } = require('webpack')
const { nodeBaseConfig } = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const ENTRY_MAIN = path.join(__dirname, 'src/main.ts')
const ENTRY_PRELOAD = path.join(__dirname, 'src/preload.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')

const COMMON_CONFIG = {
  output: { path: OUTPUT_PATH },
  plugins: [
    new DefinePlugin({
      _PKG_VERSION_: JSON.stringify("6.1.0"),
      _PKG_PRODUCT_NAME_: JSON.stringify(pkg.productName),
      _PKG_BUGS_URL_: JSON.stringify(pkg.bugs.url),
    }),
  ],
}

module.exports = [
  // main process (runs in electron)
  webpackMerge(nodeBaseConfig, COMMON_CONFIG, {
    target: 'electron-main',
    entry: { main: ENTRY_MAIN },
  }),

  // preload script (runs in the browser window)
  webpackMerge(nodeBaseConfig, COMMON_CONFIG, {
    target: 'electron-preload',
    entry: { preload: ENTRY_PRELOAD },
  }),
]
