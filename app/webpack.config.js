var argv = require('yargs').argv;
var path = require('path')
var webpack = require('webpack')

var CopyWebpackPlugin = require('copy-webpack-plugin')

var outputPathDir = path.resolve(__dirname, '../api/opentrons/server/templates')
console.log('[OT App Webpack] Output build dir path is:', outputPathDir)

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.join(outputPathDir),
    publicPath: '/',
    filename: 'build.js'
  },
  resolve: {
    extensions: ['', '.js', '.vue'],
    fallback: [path.join(__dirname, 'node_modules')],
    alias: {
      src: path.resolve(__dirname, 'src'), // this alias is used by karma tests to import modules from the ./src dir
      vue: 'vue/dist/vue.js',
      sinon: 'sinon/pkg/sinon'
    }
  },
  resolveLoader: {
    fallback: [path.join(__dirname, 'node_modules')]
  },
  module: {
    noParse: [
      /sinon/,
      /socket.io/
    ],
    preLoaders: [
      {
        test: /\.vue$/,
        loader: 'eslint',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        loader: 'eslint',
        exclude: /vue-devtools|node_modules/
      }
    ],
    loaders: [
      {
        test: /sinon.*\.js$/,
        loader: 'imports?define=>false,require=>false'
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
        loaders: ['style', 'css', 'resolve-url', 'sass?sourceMap']
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(woff|woff2)$/,
        loader: 'url-loader?limit=10000&minetype=application/font-woff'
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  headers: {
    'Access-Control-Allow-Origin': 'http://localhost:8090',
    'Access-Control-Allow-Credentials': 'true'
  },
  devtool: '#eval-source-map',
  target: 'web',  // process.env['APP_TARGET'] (TODO: bring back),
  plugins: [
      new CopyWebpackPlugin([
          {from: 'src/index.html', to: 'index.html'}
      ])
  ]
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
