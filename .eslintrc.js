'use strict'

module.exports = {
  parser: 'babel-eslint',

  extends: [
    'standard',
    'plugin:cypress/recommended',
    'plugin:react/recommended',
    'plugin:flowtype/recommended',
    'plugin:prettier/recommended',
    'prettier/flowtype',
    'prettier/react',
    'prettier/standard',
  ],

  plugins: [
    // 'eslint-plugin-cypress',
    'flowtype',
    'react',
    'react-hooks',
    'json',
    'prettier',
  ],

  rules: {
    camelcase: 'off',
    // TODO(mc, 2019-06-28): these flowtype rules are noisy (~1000 warnings),
    // so disabling globally; enable locally if working on fresh code
    // 'flowtype/require-exact-type': 'warn',
    // 'flowtype/spread-exact-type': 'warn',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-extra-boolean-cast': 'off',
    // TODO(isk, 2019-01-15): change no-default-export to error,
    // once once all warnings are resolved
    'import/no-default-export': 'warn',
  },

  globals: {},

  env: {
    node: true,
    browser: true,
    // 'cypress/globals': true,
  },

  settings: {
    react: {
      version: '16.8',
      flowVersion: '0.102',
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
