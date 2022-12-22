'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { DefinePlugin } = require('webpack')
const { nodeBaseConfig } = require('@opentrons/webpack-config')
const { versionForProject } = require('../scripts/git-version')
const pkg = require('./package.json')

const ENTRY_MAIN = path.join(__dirname, 'src/main.ts')
const ENTRY_PRELOAD = path.join(__dirname, 'src/preload.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')

const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'

const OT2_UPDATE_MANIFEST_URL =
  'https://opentrons-buildroot-ci.s3.us-east-2.amazonaws.com/releases.json'
const OT3_UPDATE_MANIFEST_URL =
  'https://ot3-development.builds.opentrons.com/ot3-oe/releases.json'
const manifestUrl = () =>
  project === 'robot-stack' ? OT2_UPDATE_MANIFEST_URL : OT3_UPDATE_MANIFEST_URL

module.exports = async () => {
  const version = await versionForProject(project)

  const COMMON_CONFIG = {
    output: { path: OUTPUT_PATH },
    plugins: [
      new DefinePlugin({
        _PKG_VERSION_: JSON.stringify(version),
        _PKG_PRODUCT_NAME_: JSON.stringify(pkg.productName),
        _PKG_BUGS_URL_: JSON.stringify(pkg.bugs.url),
        _DEFAULT_ROBOT_UPDATE_MANIFEST_URL_: JSON.stringify(manifestUrl()),
      }),
    ],
  }

  return [
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
}
