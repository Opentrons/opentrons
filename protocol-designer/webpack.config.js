'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

const { DEV_MODE, baseConfig } = require('@opentrons/webpack-config')
const { productName: title, description, author } = require('./package.json')
const PROTOCOL_DESIGNER_ENV_VAR_PREFIX = 'OT_PD_'

// TODO: BC: 2018-02-21 remove hardcoded semver version and replace
// with string from package.json version inserted at build time
// Also remove all OT_PD_VERSION env vars, the version should always
// be gleaned from the package.json

const OT_PD_VERSION = '4.0.0'
const OT_PD_BUILD_DATE = new Date().toUTCString()

const JS_ENTRY = path.join(__dirname, 'src/index.js')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')
const ERROR_HTML = path.join(__dirname, 'src/error.html')

const passThruEnvVars = Object.keys(process.env)
  .filter(v => v.startsWith(PROTOCOL_DESIGNER_ENV_VAR_PREFIX))
  .concat(['NODE_ENV'])

const envVarsWithDefaults = {
  OT_PD_VERSION,
  OT_PD_BUILD_DATE,
}

const envVars = passThruEnvVars.reduce(
  (acc, envVar) => ({ [envVar]: '', ...acc }),
  { ...envVarsWithDefaults }
)

console.log(`PD version: ${OT_PD_VERSION || 'UNKNOWN!'}`)

module.exports = merge(baseConfig, {
  entry: [JS_ENTRY],

  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: DEV_MODE ? '' : './',
  },

  plugins: [
    new webpack.EnvironmentPlugin(envVars),
    new FaviconsWebpackPlugin({
      logo: './src/images/favicon-logo.png',
      prefix: 'icons-[hash]/',
      inject: true,
      background: '#fff',
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        windows: false,
        yandex: false,
      },
    }),
    new HtmlWebpackPlugin({
      title,
      description,
      author,
      template: HTML_ENTRY,
    }),
    new HtmlWebpackPlugin({
      filename: 'error.html',
      inject: false,
      template: ERROR_HTML,
    }),
    new ScriptExtHtmlWebpackPlugin({ defaultAttribute: 'defer' }),
  ],
})
