'use strict'

module.exports = {
  parser: 'babel-eslint',

  extends: [
    'standard',
    'plugin:react/recommended',
    'plugin:flowtype/recommended',
  ],

  plugins: [
    'flowtype',
    'react',
  ],

  rules: {
    'camelcase': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'flowtype/delimiter-dangle': ['error', 'always-multiline'],
    // TODO(mc, 2018-09-04): enable this rule and fix lint failures
    'react/prop-types': 'off',
    // TODO(mc, 2018-10-25): enable this rule and fix lint failures
    'indent': 'off',
  },

  globals: {},

  env: {
    node: true,
    browser: true,
    jest: true,
  },

  settings: {
    react: {
      version: '16.2',
    },
  },
}
