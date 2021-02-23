'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { DefinePlugin } = require('webpack')
const { nodeBaseConfig } = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const ENTRY_INDEX = path.join(__dirname, 'src/index.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')

module.exports = webpackMerge(nodeBaseConfig, {
  entry: {
    index: ENTRY_INDEX,
  },
  output: { path: OUTPUT_PATH },
  plugins: [new DefinePlugin({ _PKG_VERSION_: JSON.stringify(pkg.version) })],
})
