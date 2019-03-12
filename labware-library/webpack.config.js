'use strict'

const path = require('path')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const {baseConfig} = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const JS_ENTRY = path.join(__dirname, './src/index.js')
const HTML_ENTRY = path.join(__dirname, './src/index.hbs')

const OUT_PATH = path.join(__dirname, 'dist')
const DEV_PORT = process.env.PORT || 8080

// TODO(mc, 2019-03-13): we won't need to replace entry to avoid including
//   react-hot-loader/patch once monorepo is updated to react-hot-loader@4
module.exports = merge.strategy({entry: 'replace'})(baseConfig, {
  entry: JS_ENTRY,

  output: {
    path: OUT_PATH,
  },

  module: {
    rules: [
      // process HTML template with  prerender-loader to have our app
      // statically compiled at build time into the HTML output
      {
        test: HTML_ENTRY,
        use: {
          loader: 'prerender-loader',
          // prerender-loader expects relative path (absolute doesn't work)
          options: {entry: path.relative(__dirname, JS_ENTRY)},
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: HTML_ENTRY,
      title: pkg.productName,
      description: pkg.description,
      author: pkg.author.name,
    }),
  ],

  devServer: {
    port: DEV_PORT,
  },
})
