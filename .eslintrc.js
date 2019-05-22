'use strict'

module.exports = {
  parser: 'babel-eslint',

  extends: [
    'standard',
    'plugin:react/recommended',
    'plugin:flowtype/recommended',
    'plugin:prettier/recommended',
    'prettier/flowtype',
    'prettier/react',
    'prettier/standard',
  ],

  plugins: ['flowtype', 'react', 'react-hooks', 'json', 'prettier'],

  rules: {
    camelcase: 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },

  globals: {},

  env: {
    node: true,
    browser: true,
  },

  settings: {
    react: {
      version: '16.8',
    },
  },

  overrides: [
    {
      files: [
        '**/test/**.js',
        '**/test-with-flow/**.js',
        '**/__tests__/**.js',
        '**/__mocks__/**.js',
        'scripts/*.js',
      ],
      env: {
        jest: true,
      },
    },
  ],
}
