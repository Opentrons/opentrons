// Base webpack config used across other specific configs

import path from 'path'
import webpack from 'webpack'
import {dependencies as externals} from './package.json'

export default {
  // TODO(mc): what is this and why are we doing it?
  externals: Object.keys(externals || {}),

  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      }
    }]
  },

  output: {
    path: path.join(__dirname, 'ui/dist'),
    filename: 'bundle.js',
    // https://github.com/webpack/webpack/issues/1114
    // TODO(mc): not sure this is necessary
    libraryTarget: 'commonjs2'
  },

  // determine the array of extensions that should be used to resolve modules
  // TODO(mc): prefer requiring the actual path to this sort of magic
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [
      path.join(__dirname, 'ui'),
      path.join(__dirname, 'shell'),
      'node_modules'
    ]
  },

  plugins: [
    new webpack.NamedModulesPlugin(),
    // set default NODE_ENV to "development"
    new webpack.EnvironmentPlugin({NODE_ENV: 'development'})
  ],

  node: {
    __dirname: true
  }
}
