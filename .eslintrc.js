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

  plugins: ['flowtype', 'react', 'react-hooks', 'json', 'prettier', 'jest'],

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
    'import/no-default-export': 'error',
  },

  globals: {},

  env: {
    node: true,
    browser: true,
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
        '**/__tests__/**.js',
        '**/__mocks__/**.js',
        '**/__utils__/**.js',
        '**/__fixtures__/**.js',
        'scripts/*.js',
      ],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      rules: {
        'jest/expect-expect': 'off',
        'jest/no-standalone-expect': 'off',
        'jest/no-disabled-tests': 'error',
      },
    },
    {
      files: ['**/cypress/**'],
      extends: ['plugin:cypress/recommended'],
    },
  ],
}
