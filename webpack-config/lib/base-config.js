// webpack base config
'use strict'

const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const rules = require('./rules')

const DEV_MODE = process.env.NODE_ENV !== 'production'
const ANALYZER =
  process.env.ANALYZER === 'true' &&
  new BundleAnalyzerPlugin({analyzerMode: 'server', openAnalyzer: true})

module.exports = {
  target: 'web',

  entry: DEV_MODE ? ['react-hot-loader/patch'] : [],

  mode: DEV_MODE ? 'development' : 'production',

  devtool: DEV_MODE ? 'eval-source-map' : 'source-map',

  module: {
    rules: [
      rules.js,
      rules.worker,
      rules.globalCss,
      rules.localCss,
      rules.handlebars,
      rules.fonts,
      rules.images,
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: DEV_MODE ? '[name].css' : '[name].[hash].css',
      chunkFilename: DEV_MODE ? '[id].css' : '[id].[hash].css',
    }),
    ANALYZER,
  ].filter(Boolean),

  optimization: {
    minimizer: [
      new TerserPlugin({cache: true, parallel: true, sourceMap: true}),
      new OptimizeCSSAssetsPlugin({}),
    ],

    splitChunks: {
      cacheGroups: {
        // bundle CSS into one file
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },

  devServer: {
    historyApiFallback: true,
  },
}
