var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: './app/renderer/src/main.js',
  output: {
    // path: path.resolve(__dirname, './app/renderer/dist'),
    path: path.resolve(__dirname, './server/templates/dist'),
    publicPath: '/dist/',
    filename: 'build.js'
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  module: {
    loaders: [
      {
        test: /\.vue$/,
        loader: 'vue',
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'test')
        ]
      },
      {
        test: /\.js$/,
        loader: 'babel',
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'test')
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file',
        query: {
          name: '[name].[ext]?[hash]'
        },
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'test')
        ],
      },
      {
        test: /\.(svg|jpg)$/,
        loaders: [
          'url?limit=10000'
        ],
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'test')
        ],
      },
      {
        test: /\.scss$/,
        loaders: ["style", "css", "sass"],
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'test')
        ],
      },
      {
        test: /\.(woff|woff2)$/, loader: "url-loader?limit=10000&minetype=application/font-woff",
        include: [
          path.join(__dirname, 'app'),
          path.join(__dirname, 'test')
        ]
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  headers: { "Access-Control-Allow-Origin": "http://localhost:5000", "Access-Control-Allow-Credentials": "true" },
  devtool: '#eval-source-map',
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  },
  target: "electron"
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ])
}
