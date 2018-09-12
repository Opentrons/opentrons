'use strict'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const {rules} = require('@opentrons/webpack-config')
const {gitDescribeSync} = require('git-describe')

const DEV = process.env.NODE_ENV !== 'production'
const PROTOCOL_DESIGNER_ENV_VAR_PREFIX = 'OT_PD_'

const gitInfo = gitDescribeSync()
const OT_PD_VERSION = gitInfo && gitInfo.raw

const passThruEnvVars = Object.keys(process.env)
  .filter(v => v.startsWith(PROTOCOL_DESIGNER_ENV_VAR_PREFIX))
  .concat(['NODE_ENV'])

const envVarsWithDefaults = {OT_PD_VERSION}

const envVars = passThruEnvVars.reduce((acc, envVar) =>
  ({[envVar]: '', ...acc}),
  {...envVarsWithDefaults}
)

console.log('PD version: ' + (process.env.OT_PD_VERSION || OT_PD_VERSION || 'UNKNOWN!'))

module.exports = {
  entry: [
    './src/index.js',
  ],

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
  },

  module: {
    rules: [
      rules.js,
      rules.localCss,
      rules.images,
    ],
  },

  devServer: {
    historyApiFallback: true,
  },

  devtool: DEV ? 'eval-source-map' : 'source-map',

  plugins: [
    new webpack.EnvironmentPlugin(envVars),

    new ExtractTextPlugin({
      filename: 'bundle.css',
      disable: DEV,
      ignoreOrder: true,
    }),
  ],
}

if (DEV) {
  module.exports.entry.unshift(
    'react-hot-loader/patch'
  )

  module.exports.plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin()
  )
}
