'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { nodeBaseConfig } = require('@opentrons/webpack-config')

const ENTRY_CLI = path.join(__dirname, 'src/cli.js')
const OUTPUT_PATH = path.join(__dirname, 'lib')

module.exports = webpackMerge(nodeBaseConfig, {
  entry: { cli: ENTRY_CLI },
  output: { path: OUTPUT_PATH },
})
