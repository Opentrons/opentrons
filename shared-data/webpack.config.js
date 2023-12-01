'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { baseConfig } = require('@opentrons/webpack-config')

const ENTRY_INDEX = path.join(__dirname, 'js/index.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')

module.exports = async () =>
  webpackMerge(baseConfig, {
    entry: { index: ENTRY_INDEX },
    output: {
      path: OUTPUT_PATH,
      filename: 'opentrons-shared-data.js',
      library: '@opentrons/shared-data',
      libraryTarget: 'umd'
    },
  })
