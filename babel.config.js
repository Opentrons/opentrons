'use strict'

const PRESET_ENV_NO_MODULES = ['@babel/preset-env', {modules: false}]
const PRESET_ENV_CJS_MODULES = ['@babel/preset-env', {modules: 'commonjs'}]

module.exports = {
  env: {
    production: {
      plugins: ['babel-plugin-unassert'],
    },
    development: {
      plugins: ['react-hot-loader/babel'],
    },
    test: {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
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
