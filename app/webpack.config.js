// base webpack config used across other specific configs
'use strict'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')

const namedRules = require('./webpack/rules')
const devServerConfig = require('./webpack/dev-server')

const DEV = process.env.NODE_ENV !== 'production'
const ANALYZER = process.env.ANALYZER === 'true'

const PORT = process.env.PORT || 8090

const JS_BUNDLE_ENTRY = path.join(__dirname, './ui/index.js')

// TODO(mc, 2017-09-13): find out why PUBLIC_PATH is relative and not absolute
const OUTPUT_PATH = path.join(__dirname, 'ui/dist')
const PUBLIC_PATH = '../dist/'
const JS_OUTPUT_NAME = 'bundle.js'
const CSS_OUTPUT_NAME = 'style.css'

const entry = [
  JS_BUNDLE_ENTRY
]

const output = {
  path: OUTPUT_PATH,
  filename: JS_OUTPUT_NAME,
  publicPath: PUBLIC_PATH
}

const rules = [
  namedRules.babel,
  namedRules.worker,
  namedRules.globalCss,
  namedRules.localCss,
  namedRules.fonts,
  namedRules.images
]

const target = 'electron-renderer'

const plugins = [
  new webpack.EnvironmentPlugin({
    NODE_ENV: 'development',
    DEBUG: false
  }),

  new ExtractTextPlugin(CSS_OUTPUT_NAME),

  new BundleAnalyzerPlugin({
    analyzerMode: (ANALYZER && 'server') || 'disabled',
    openAnalyzer: ANALYZER
  })
]

let devtool = 'source-map'

let devServer = {}

if (DEV) {
  const publicPath = `http://localhost:${PORT}/dist/`
  const contentBase = [path.join(__dirname, './ui')]

  entry.unshift('react-hot-loader/patch')

  output.publicPath = publicPath

  plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin()
  )

  devtool = 'eval-source-map'

  devServer = devServerConfig(PORT, publicPath, contentBase)
}

module.exports = {
  entry,
  module: {rules},
  output,
  target,
  plugins,
  devtool,
  devServer
}
