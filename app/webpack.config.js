// webpack config to build UI bundles and assets
'use strict'

const path = require('path')
const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

const {DEV_MODE, baseConfig} = require('@opentrons/webpack-config')
const {productName: title} = require('@opentrons/app-shell/package.json')
const {description, author} = require('./package.json')

const JS_ENTRY = path.join(__dirname, 'src/index.js')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')
const OUTPUT_PATH = path.join(__dirname, 'dist')
const JS_OUTPUT_NAME = 'bundle.js'

const PORT = process.env.PORT || 8080
const CONTENT_BASE = path.join(__dirname, './src')
const PUBLIC_PATH = DEV_MODE ? `http://localhost:${PORT}/` : ''

module.exports = webpackMerge(baseConfig, {
  entry: [JS_ENTRY],

  output: Object.assign(
    {
      path: OUTPUT_PATH,
      filename: JS_OUTPUT_NAME,
      publicPath: PUBLIC_PATH,
    },
    // workaround for worker-loader HMR
    // see https://github.com/webpack/webpack/issues/6642
    DEV_MODE ? {globalObject: 'this'} : {}
  ),

  plugins: [
    new webpack.EnvironmentPlugin(
      Object.keys(process.env)
        .filter(v => v.startsWith('OT_APP'))
        .concat(['NODE_ENV'])
    ),

    new HtmlWebpackPlugin({
      title,
      description,
      author,
      template: HTML_ENTRY,
      intercomId: process.env.OT_APP_INTERCOM_ID,
    }),

    new ScriptExtHtmlWebpackPlugin({defaultAttribute: 'defer'}),
  ],

  node: {
    __filename: true,
    // use userland events because webpack's is out of date
    // https://github.com/webpack/node-libs-browser/issues/78
    events: false,
  },

  devServer: {
    port: PORT,
    publicPath: PUBLIC_PATH,
    contentBase: [CONTENT_BASE],
  },
})
