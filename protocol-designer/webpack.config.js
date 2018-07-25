'use strict'

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const {rules} = require('@opentrons/webpack-config')

const DEV = process.env.NODE_ENV !== 'production'
const PROTOCOL_DESIGNER_ENV_VAR_PREFIX = 'OT_PD_'

module.exports = {
  entry: [
    './src/index.js'
  ],

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist')
  },

  module: {
    rules: [
      rules.js,
      rules.localCss,
      rules.handlebars,
      rules.images
    ]
  },

  devServer: {
    historyApiFallback: true
  },

  devtool: DEV ? 'eval-source-map' : 'source-map',

  plugins: [
    new webpack.EnvironmentPlugin(
      Object.keys(process.env).filter(v => v.startsWith(PROTOCOL_DESIGNER_ENV_VAR_PREFIX)).concat([
        'NODE_ENV'
      ])
    ),

    new ExtractTextPlugin({
      filename: 'bundle.css',
      disable: DEV,
      ignoreOrder: true
    }),

    new HtmlWebpackPlugin({
      title: 'Opentrons Protocol Designer',
      template: './src/index.hbs',
      intercomId: process.env.OT_PD_INTERCOM_ID
    })
  ]
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
