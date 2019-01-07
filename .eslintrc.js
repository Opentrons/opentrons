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
    'json',
  ],

  rules: {
    'camelcase': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'flowtype/delimiter-dangle': ['error', 'always-multiline'],
  },

  globals: {},

  env: {
    node: true,
    browser: true,
  },

  settings: {
    react: {
      version: '16.2',
    },
  },

  overrides: [
    {
      files: [
        '**/test/**.js',
        '**/test-with-flow/**.js',
        '**/__tests__/**.js',
        '**/__mocks__/**.js',
      ],
      env: {
        jest: true,
      },
    },
  ],
}
