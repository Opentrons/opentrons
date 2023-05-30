'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const WorkerPlugin = require('worker-plugin')
const { versionForProject } = require('../scripts/git-version')

const { DEV_MODE, baseConfig } = require('@opentrons/webpack-config')
const { productName: title, description, author } = require('./package.json')
const PROTOCOL_DESIGNER_ENV_VAR_PREFIX = 'OT_PD_'
const PASS_THROUGH_ENV_VARS = Object.keys(process.env)
  .filter(v => v.startsWith(PROTOCOL_DESIGNER_ENV_VAR_PREFIX))
  .concat(['NODE_ENV', 'CYPRESS'])

const OT_PD_BUILD_DATE = new Date().toUTCString()

const JS_ENTRY = path.join(__dirname, 'src/index.tsx')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')
const ERROR_HTML = path.join(__dirname, 'src/error.html')

const OUTPUT_PATH = path.join(__dirname, 'dist')
const PUBLIC_PATH = DEV_MODE ? '' : './'

const testAliases =
  process.env.CYPRESS === '1'
    ? {
        'file-saver': path.resolve(__dirname, 'cypress/mocks/file-saver.js'),
      }
    : {}

module.exports = async () => {
  const OT_PD_VERSION = await versionForProject('protocol-designer')

  const envVarsWithDefaults = {
    OT_PD_VERSION,
    OT_PD_BUILD_DATE,
  }

  const envVars = PASS_THROUGH_ENV_VARS.reduce(
    (acc, envVar) => ({ [envVar]: '', ...acc }),
    { ...envVarsWithDefaults }
  )
  console.log(`PD version: ${OT_PD_VERSION || 'UNKNOWN!'}`)
  return merge(baseConfig, {
    entry: [JS_ENTRY],

    output: Object.assign(
      {
        path: OUTPUT_PATH,
        publicPath: PUBLIC_PATH,
      },
      // workaround for worker-plugin HMR
      // see https://github.com/GoogleChromeLabs/worker-plugin#globalobject-string--false
      DEV_MODE ? { globalObject: 'this' } : {}
    ),

    plugins: [
      new webpack.EnvironmentPlugin(envVars),
      new WorkerPlugin({
        // disable warnings about HMR when we're in prod
        globalObject: DEV_MODE ? 'self' : false,
        // add required JS plugins to child compiler
        plugins: ['EnvironmentPlugin'],
      }),
      new HtmlWebpackPlugin({
        title,
        description,
        author,
        template: HTML_ENTRY,
        favicon: './src/images/favicon.ico',
      }),
      new HtmlWebpackPlugin({
        filename: 'error.html',
        inject: false,
        template: ERROR_HTML,
      }),
      new ScriptExtHtmlWebpackPlugin({ defaultAttribute: 'defer' }),
    ],

    resolve: {
      alias: testAliases,
    },
  })
}
