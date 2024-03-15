'use strict'

const path = require('path')
const { rules } = require('@opentrons/webpack-config')

const ENTRY_INDEX = path.join(__dirname, 'src/barrel.ts')
const OUTPUT_PATH = path.join(__dirname, 'lib')

module.exports = {
  target: 'web',
  entry: { index: ENTRY_INDEX },
  output: {
    path: OUTPUT_PATH,
    filename: 'opentrons-components.js',
    library: '@opentrons/components',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  mode: 'production',
  module: { rules: [rules.js] },
  resolve: {
    extensions: ['.wasm', '.mjs', '.js', '.ts', '.tsx', '.json'],
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
    },
  },
}
