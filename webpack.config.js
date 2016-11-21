var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: './app/renderer/src/main.js',
  output: {
    path: path.resolve(__dirname, './server/templates/dist'),
    publicPath: '/dist/',
    filename: 'build.js'
  },
  resolve: {
    extensions: ['', '.js', '.vue'],
    fallback: [path.join(__dirname, 'node_modules')],
    alias: {
      renderer: path.resolve(__dirname, 'app/renderer'),
      vue: 'vue/dist/vue.js',
      sinon: 'sinon/pkg/sinon'
    }
  },
  resolveLoader: {
    fallback: [path.join(__dirname, 'node_modules')]
  },
  module: {
    noParse: [
      /sinon/
    ],
    preLoaders: [

    ],
    loaders: [
      {
        test: /sinon.*\.js$/,
        loader: "imports?define=>false,require=>false"
      },
      {
        test: /\.vue$/,
        loader: 'vue'
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file',
        query: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.(svg|jpg)$/,
        loaders: [
          'url?limit=10000'
        ]
      },
      {
        test: /\.scss$/,
        loaders: ["style", "css", 'resolve-url', "sass?sourceMap"]
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(woff|woff2)$/,
        loader: "url-loader?limit=10000&minetype=application/font-woff"
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  headers: { "Access-Control-Allow-Origin": "http://localhost:5000", "Access-Control-Allow-Credentials": "true" },
  devtool: '#eval-source-map',
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
