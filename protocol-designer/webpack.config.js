const webpack = require('webpack')
const GoogleFontsPlugin = require('google-fonts-webpack-plugin')
const path = require('path')

module.exports = {
  entry: [
    'react-hot-loader/patch',
    // 'webpack-dev-server/client?http://localhost:8080',
    // 'webpack/hot/only-dev-server',
    './src/index.js'
  ],

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist')
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp|svg)$/,
        use: {
          loader: 'url-loader'
          // options: {
          //   limit: DATA_URL_BYTE_LIMIT
          // }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[path][name]__[local]--[hash:base64:5]'
            }
          }
        ]
      }
    ]
  },

  devServer: {
    historyApiFallback: true
    // hot: true
  },

  devtool: process.env.NODE_ENV !== 'production' ? 'eval-source-map' : false,

  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new GoogleFontsPlugin({
      fonts: [{ family: 'Open Sans' }]
    })
  ]
}
