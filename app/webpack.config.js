// webpack config to build UI bundles and assets
'use strict'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')

const {rules: namedRules} = require('@opentrons/webpack-config')
const devServerConfig = require('./webpack/dev-server')

const {productName} = require('@opentrons/app-shell/package.json')
const {description, author} = require('./package.json')

const DEV = process.env.NODE_ENV !== 'production'
const ANALYZER = process.env.ANALYZER === 'true'
const PORT = process.env.PORT

const JS_BUNDLE_ENTRY = path.join(__dirname, 'src/index.js')
const OUTPUT_PATH = path.join(__dirname, 'dist')
const JS_OUTPUT_NAME = 'bundle.js'
const CSS_OUTPUT_NAME = 'style.css'

const entry = [
  JS_BUNDLE_ENTRY,
]

const output = {
  path: OUTPUT_PATH,
  filename: JS_OUTPUT_NAME,
}

const rules = [
  namedRules.js,
  namedRules.worker,
  namedRules.globalCss,
  namedRules.localCss,
  namedRules.handlebars,
  namedRules.fonts,
  namedRules.images,
]

const target = 'electron-renderer'

const plugins = [
  new webpack.EnvironmentPlugin(
    Object.keys(process.env).filter(v => v.startsWith('OT_APP')).concat([
      'NODE_ENV',
    ])
  ),

  new ExtractTextPlugin({
    filename: CSS_OUTPUT_NAME,
    disable: DEV,
    ignoreOrder: true,
  }),

  new HtmlWebpackPlugin({
    title: productName,
    template: './src/index.hbs',
    description,
    author,
    intercomId: process.env.OT_APP_INTERCOM_ID,
  }),

  new ScriptExtHtmlWebpackPlugin({
    defaultAttribute: 'defer',
  }),
]

let devtool = 'source-map'

let devServer = {}

if (DEV) {
  const publicPath = `http://localhost:${PORT}/`
  const contentBase = [path.join(__dirname, './src')]

  entry.unshift('react-hot-loader/patch')

  output.publicPath = publicPath

  plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin()
  )

  devtool = 'eval-source-map'

  devServer = devServerConfig(PORT, publicPath, contentBase)
}

if (ANALYZER) {
  plugins.push(
    new BundleAnalyzerPlugin({analyzerMode: 'server', openAnalyzer: true})
  )
}

module.exports = {
  entry,
  module: {rules},
  output,
  target,
  plugins,
  devtool,
  devServer,
  node: {
    __filename: true,
  },
}
