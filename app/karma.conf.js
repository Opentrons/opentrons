import merge from 'webpack-merge'
import path from 'path'
import baseConfig from './webpack.config.renderer.dev'

module.exports = function (config) {
  config.set({
    // to run in additional browsers:
    // 1. install corresponding karma launcher
    //    http://karma-runner.github.io/0.13/config/browsers.html
    // 2. add it to the `browsers` array below.
    browsers: ['Electron'],
    frameworks: ['mocha'], // TODO: move to Jasmine as it has built-in mocks and spies
    reporters: ['spec', 'coverage'],
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js', // How do we make this shorter?
      'test/index.js'
    ],
    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap']
    },
    // `useIframe: false` is for launching a new window instead of using an iframe
    // In Electron, iframes don't get `nodeIntegration` privileges yet windows do
    client: {
      useIframe: false
    },
    webpack: merge.smart(baseConfig, {
      devtool: 'inline-source-map',
      resolve: {
        alias: {
          // Override rest_api_wrapper with test mock
          rest_api_wrapper: path.resolve(__dirname, 'test/rest_api_wrapper_mock.js')
        }
      }
    }),
    webpackMiddleware: {
      stats: 'errors-only'
    },
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        // TODO: integrate with coveralls
        // maybe run lcov from command line for development purposes?
        // Look into https://github.com/istanbuljs/nyc
        // { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    }
  })
}
