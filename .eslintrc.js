'use strict'

module.exports = {
  root: true,

  parser: '@babel/eslint-parser',

  extends: [
    'standard',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/react',
    'prettier/standard',
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

    // TODO(mc, 2021-01-29): fix these and remove warning overrides
    'dot-notation': 'warn',
    'lines-between-class-members': 'warn',
    'array-callback-return': 'warn',
    'no-prototype-builtins': 'warn',
    'no-import-assign': 'warn',
    'default-case-last': 'warn',
    'no-case-declarations': 'warn',
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
    {
      files: ['**/*.js'],
      parser: '@babel/eslint-parser',
      extends: ['plugin:flowtype/recommended', 'prettier/flowtype'],
    },
    {
      files: ['**/*.@(ts|tsx)'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/no-use-before-define': [
          'error',
          { functions: false, classes: true },
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          { allowExpressions: true, allowTypedFunctionExpressions: true },
        ],
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
}
