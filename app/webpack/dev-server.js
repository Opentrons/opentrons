// webpack dev server configuration
'use strict'

module.exports = function devServerConfig (port, publicPath, contentBase) {
  return {
    port,
    publicPath,
    compress: true,
    noInfo: true,
    stats: 'errors-only',
    inline: true,
    lazy: false,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    contentBase,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 100,
    },
    historyApiFallback: {
      verbose: true,
      disableDotRule: false,
    },
  }
}
