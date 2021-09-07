'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

const { DEV_MODE, baseConfig } = require('@opentrons/webpack-config')
const { productName: title, description, author } = require('./package.json')

const JS_BUNDLE_ENTRY = path.join(__dirname, 'src/index.tsx')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')
const OUTPUT_PATH = path.join(__dirname, 'dist')

module.exports = webpackMerge(baseConfig, {
  entry: [JS_BUNDLE_ENTRY],

  output: {
    path: OUTPUT_PATH,
    publicPath: DEV_MODE ? '' : './',
  },

  plugins: [
    new HtmlWebpackPlugin({ title, description, author, template: HTML_ENTRY }),
    new ScriptExtHtmlWebpackPlugin({ defaultAttribute: 'defer' }),
  ],
})
