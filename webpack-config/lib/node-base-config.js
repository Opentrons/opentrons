'use strict'

const webpackMerge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const baseConfig = require('./base-config')
const { ENABLE_ANALYZER } = require('./env')

const MERGE_STRATEGY = {
  entry: 'replace',
  plugins: 'replace',
}

module.exports = webpackMerge.strategy(MERGE_STRATEGY)(baseConfig, {
  target: 'node',

  entry: {},

  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs',
  },

  plugins: [
    ENABLE_ANALYZER &&
      new BundleAnalyzerPlugin({ analyzerMode: 'server', openAnalyzer: true }),
  ].filter(Boolean),

  // do not attempt to polyfill nor mock built-in Node libraries and globals
  node: false,

  // exclude package.json dependencies from the bundle
  externals: [
    nodeExternals({
      whitelist: /^@opentrons\/.*/,
      modulesFromFile: {
        include: ['dependencies'],
        exclude: ['devDependencies'],
      },
    }),
  ],
})
