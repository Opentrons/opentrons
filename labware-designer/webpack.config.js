'use strict'

const path = require('path')
const webpackMerge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

const {baseConfig} = require('@opentrons/webpack-config')
const {productName: title, description, author} = require('./package.json')

const JS_ENTRY = path.join(__dirname, 'src/index.js')
const HTML_ENTRY = path.join(__dirname, 'src/index.hbs')
const OUTPUT_PATH = path.join(__dirname, 'dist')
const JS_OUTPUT_NAME = 'bundle.js'

module.exports = webpackMerge(baseConfig, {
  entry: [JS_ENTRY],

  output: {
    path: OUTPUT_PATH,
    filename: JS_OUTPUT_NAME,
  },

  plugins: [
    new HtmlWebpackPlugin({title, description, author, template: HTML_ENTRY}),
    new ScriptExtHtmlWebpackPlugin({defaultAttribute: 'defer'}),
  ],
})
