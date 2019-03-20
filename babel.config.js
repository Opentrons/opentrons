'use strict'

const PRESET_ENV_NO_MODULES = [
  '@babel/preset-env',
  {
    modules: false,
    // TODO(mc, 2019-03-13): uncomment this line to enable babel polyfill
    // useBuiltIns: 'usage',
  },
]

const PRESET_ENV_CJS_MODULES = ['@babel/preset-env', {modules: 'commonjs'}]

module.exports = {
  env: {
    production: {
      // TODO(mc, 2019-03-13): add '@babel/plugin-transform-runtime'
      //   along with useBuiltIns TODO above
      plugins: ['babel-plugin-unassert'],
    },
    development: {
      plugins: ['react-hot-loader/babel'],
    },
    test: {
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        ['babel-plugin-dynamic-import-node', {noInterop: true}],
      ],
    },
  },
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-syntax-dynamic-import',
  ],
  presets: ['@babel/preset-flow', '@babel/preset-react', PRESET_ENV_NO_MODULES],
  overrides: [
    {
      test: 'app-shell/**/*',
      presets: [PRESET_ENV_CJS_MODULES],
    },
    {
      test: 'discovery-client/**/*',
      presets: [PRESET_ENV_CJS_MODULES],
    },
  ],
}
