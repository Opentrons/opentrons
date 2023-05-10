'use strict'
const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const glob = require('glob')

const { baseConfig } = require('@opentrons/webpack-config')
// const {baseConfig, DEV_MODE} = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const { versionForProject } = require('../scripts/git-version')

const JS_ENTRY = path.join(__dirname, 'src/index.tsx')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')
const OUT_PATH = path.join(__dirname, 'dist')

const LABWARE_LIBRARY_ENV_VAR_PREFIX = 'OT_LL'

const passThruEnvVars = Object.keys(process.env)
  .filter(v => v.startsWith(LABWARE_LIBRARY_ENV_VAR_PREFIX))
  .concat(['NODE_ENV', 'CYPRESS'])

const testAliases =
  process.env.CYPRESS === '1'
    ? {
        'file-saver': path.resolve(__dirname, 'cypress/mocks/file-saver.js'),
      }
    : {}

module.exports = async () => {
  const envVarsWithDefaults = {
    OT_LL_VERSION: await versionForProject('labware-library'),
    OT_LL_BUILD_DATE: new Date().toUTCString(),
  }

  const envVars = passThruEnvVars.reduce(
    (acc, envVar) => ({ [envVar]: '', ...acc }),
    { ...envVarsWithDefaults }
  )

  return merge(baseConfig, {
    entry: JS_ENTRY,

    output: {
      path: OUT_PATH,
      publicPath: '/',
    },

    plugins: [
      new webpack.EnvironmentPlugin(envVars),

      new HtmlWebpackPlugin({
        template: HTML_ENTRY,
        title: pkg.productName,
        description: pkg.description,
        author: pkg.author.name,
        gtmId: process.env.GTM_ID,
        favicon: './src/images/favicon.ico',
      }),
    ],

    resolve: {
      alias: testAliases,
    },
  })
}
