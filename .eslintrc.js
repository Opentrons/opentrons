'use strict'

module.exports = {
  root: true,

  parserOptions: {
    project: './*/tsconfig.json',
  },

  extends: [
    'standard-with-typescript',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/react',
    'prettier/standard',
    'prettier/@typescript-eslint',
  ],

  plugins: ['flowtype', 'react', 'react-hooks', 'json', 'prettier', 'jest'],

  rules: {
    camelcase: 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-extra-boolean-cast': 'off',
    'import/no-default-export': 'error',
    '@typescript-eslint/promise-function-async': 'off',

    // TODO(mc, 2021-01-29): fix these and remove warning overrides
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    'dot-notation': 'warn',
    'lines-between-class-members': 'warn',
    'array-callback-return': 'warn',
    'no-prototype-builtins': 'warn',
    'no-import-assign': 'warn',
    'default-case-last': 'warn',
    'no-case-declarations': 'warn',
    'prefer-regex-literals': 'warn',
    'react/prop-types': 'warn',
  },

  globals: {},

  env: {
    node: true,
    browser: true,
  },

  settings: {
    react: {
      version: '16.8',
      flowVersion: '0.125.1',
    },
  },

  overrides: [
    {
      files: ['**/*.js'],
      parser: '@babel/eslint-parser',
      extends: ['plugin:flowtype/recommended', 'prettier/flowtype'],
    },
    {
      files: [
        '**/test/**.js',
        '**/__tests__/**.@(js|ts|tsx)',
        '**/__mocks__/**.@(js|ts|tsx)',
        '**/__utils__/**.@(js|ts|tsx)',
        '**/__fixtures__/**.@(js|ts|tsx)',
        'scripts/*.@(js|ts|tsx)',
      ],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      rules: {
        'jest/expect-expect': 'off',
        'jest/no-standalone-expect': 'off',
        'jest/no-disabled-tests': 'error',
        'jest/consistent-test-it': 'error',
        '@typescript-eslint/consistent-type-assertions': 'off',

        // TODO(mc, 2021-01-29): fix these and remove warning overrides
        'jest/no-deprecated-functions': 'warn',
        'jest/valid-title': 'warn',
        'jest/no-conditional-expect': 'warn',
        'jest/no-done-callback': 'warn',
      },
    },
    {
      files: ['**/cypress/**'],
      extends: ['plugin:cypress/recommended'],
    },
  ],
}
