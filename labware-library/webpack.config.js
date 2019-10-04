'use strict'
const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
// const glob = require('glob')

const { baseConfig } = require('@opentrons/webpack-config')
// const {baseConfig, DEV_MODE} = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const JS_ENTRY = path.join(__dirname, './src/index.js')
const HTML_ENTRY = path.join(__dirname, './src/index.hbs')
const OUT_PATH = path.join(__dirname, 'dist')

const LABWARE_LIBRARY_ENV_VAR_PREFIX = 'OT_LL'

module.exports = merge(baseConfig, {
  entry: JS_ENTRY,

  output: {
    path: OUT_PATH,
    publicPath: '/',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: HTML_ENTRY,
      title: pkg.productName,
      description: pkg.description,
      author: pkg.author.name,
      gtmId: process.env.GTM_ID,
    }),

    new webpack.EnvironmentPlugin(
      Object.keys(process.env)
        .filter(v => v.startsWith(LABWARE_LIBRARY_ENV_VAR_PREFIX))
        .concat(['NODE_ENV'])
    ),

    // vars for analytics reporting
    new webpack.DefinePlugin({
      'process.env.OT_LL_VERSION': JSON.stringify(pkg.version),
      'process.env.OT_LL_BUILD_DATE': JSON.stringify(new Date().toUTCString()),
    }),

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
  ],
})
