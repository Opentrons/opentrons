'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const { DefinePlugin } = require('webpack')
const { nodeBaseConfig } = require('@opentrons/webpack-config')
const { versionForProject } = require('../../scripts/git-version')

const ENTRY_INDEX = path.join(__dirname, 'src/index.ts')
const ENTRY_CLI = path.join(__dirname, 'src/cli.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')
const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'

module.exports = async () =>
  webpackMerge(nodeBaseConfig, {
    entry: {
      index: ENTRY_INDEX,
      cli: ENTRY_CLI,
    },
    output: { path: OUTPUT_PATH },
    plugins: [
      new DefinePlugin({
        _PKG_VERSION_: JSON.stringify(await versionForProject(project)),
      }),
    ],
  })
