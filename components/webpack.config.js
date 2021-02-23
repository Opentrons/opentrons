const path = require('path')
const webpackMerge = require('webpack-merge')
const { DefinePlugin } = require('webpack')
const { baseConfig } = require('@opentrons/webpack-config')
const pkg = require('./package.json')

const ENTRY_INDEX = path.join(__dirname, 'src/index.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')

module.exports = webpackMerge(baseConfig, {
  entry: {
    index: ENTRY_INDEX,
  },
  output: { path: OUTPUT_PATH },
  plugins: [new DefinePlugin({ _PKG_VERSION_: JSON.stringify(pkg.version) })],
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.join(__dirname, 'src'),
        use: [
          'style-loader',
          {
            loader: 'typings-for-css-modules-loader',
            options: {
              modules: true,
              namedExport: true,
            },
          },
        ],
      },
    ],
  },
})
