'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { nodeBaseConfig } = require('@opentrons/webpack-config')

const ENTRY_MAIN = path.join(__dirname, 'src/main.js')
const ENTRY_PRELOAD = path.join(__dirname, 'src/preload.js')
const OUTPUT_PATH = path.join(__dirname, 'lib')

const COMMON_CONFIG = { output: { path: OUTPUT_PATH } }

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
