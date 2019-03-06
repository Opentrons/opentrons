'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

const {DEV_MODE, baseConfig, rules} = require('@opentrons/webpack-config')
const {productName: title, description, author} = require('./package.json')
const PROTOCOL_DESIGNER_ENV_VAR_PREFIX = 'OT_PD_'

// TODO: BC: 2018-02-21 remove hardcoded semver version and replace
// with string from package.json version inserted at build time
// Also remove all OT_PD_VERSION env vars, the version should always
// be gleaned from the package.json

const OT_PD_VERSION = '1.1.0'
const OT_PD_BUILD_DATE = new Date().toUTCString()

const JS_ENTRY = path.join(__dirname, 'src/index.js')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')

const passThruEnvVars = Object.keys(process.env)
  .filter(v => v.startsWith(PROTOCOL_DESIGNER_ENV_VAR_PREFIX))
  .concat(['NODE_ENV'])

const envVarsWithDefaults = {
  OT_PD_VERSION,
  OT_PD_BUILD_DATE,
}

const envVars = passThruEnvVars.reduce(
  (acc, envVar) => ({[envVar]: '', ...acc}),
  {...envVarsWithDefaults}
)

console.log(`PD version: ${OT_PD_VERSION || 'UNKNOWN!'}`)

module.exports = merge.strategy({'module.rules': 'replace'})(baseConfig, {
  entry: [JS_ENTRY],

  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: DEV_MODE ? '' : './',
  },

  module: {
    rules: [
      rules.js,
      rules.localCss,
      rules.handlebars,
      // TODO(mc, 2019-03-06): remove this override once baseConfig rule is
      //   sane (see TODO in webpack-config/lib/rules.js)
      Object.assign({}, rules.images, {
        use: {loader: 'url-loader', options: {limit: 1024}},
      }),
    ],
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
      title, description, author, template: HTML_ENTRY}),
    new ScriptExtHtmlWebpackPlugin({defaultAttribute: 'defer'}),
  ],
})
