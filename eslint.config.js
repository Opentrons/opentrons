'use strict'

const path = require('path')
const { defineConfig, globalIgnores } = require('eslint/config')

const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const json = require('eslint-plugin-json')
const testingLibrary = require('eslint-plugin-testing-library')
const opentrons = require('eslint-plugin-opentrons')
const eslintReact = require('@eslint-react/eslint-plugin')
const jsxA11Y = require('eslint-plugin-jsx-a11y')
const importPlugin = require('eslint-plugin-import')
const nodePlugin = require('eslint-plugin-n')
const storybookPlugin = require('eslint-plugin-storybook')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')

const { fixupPluginRules } = require('@eslint/compat')

const globals = require('globals')
const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const oxlint = require('eslint-plugin-oxlint')

const tsconfigPath = path.join(__dirname, 'tsconfig-eslint.json')

const withFiles = (configs, files) =>
  configs.map(config => ({
    ...config,
    files,
  }))

module.exports = defineConfig([
  {
    files: ['**/*.{js,jsx,cjs,mjs,ts,tsx,mts}', '**/.*.{js,cjs,mjs}'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: tsconfigPath,
      },

      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    plugins: {
      react,
      'react-hooks': fixupPluginRules(reactHooks),
      json,
      'testing-library': testingLibrary,
      opentrons,
      '@eslint-react': eslintReact,
      'jsx-a11y': jsxA11Y,
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      n: nodePlugin,
      storybook: storybookPlugin,
    },

    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },

    settings: {
      react: {
        version: '17.0.1',
      },
    },

    rules: {
      'import/no-default-export': 'off',
      'n/no-callback-literal': 'off',
      'storybook/prefer-pascal-case': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks: '(useDrag|useDrop)',
        },
      ],
    },
  },
  {
    files: [
      '.storybook/**/*.{ts,tsx}',
      '**/vite.config.{mts,ts}',
      'scripts/**/*.{mts,ts,mjs,js}',
    ],

    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],

    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/naming-convention': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',
      '@typescript-eslint/ban-types': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/consistent-generic-constructors': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      'lines-between-class-members': 'warn',
    },
  },
  {
    files: [
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      '**/.*.js',
      '**/.*.cjs',
      '**/.*.mjs',
    ],
    ...compat.extends('plugin:@typescript-eslint/disable-type-checked')[0],
  },
  {
    files: [
      './app/src/**/*.{ts,tsx}',
      './opentrons-ai-client/src/**/*.{ts,tsx}',
      './protocol-designer/src/**/*.{ts,tsx}',
      './protocol-visualization/src/**/*.{ts,tsx}',
    ],

    rules: {
      '@eslint-react/no-nested-component-definitions': 'error',
      'jsx-a11y/alt-text': 'error',
    },
  },
  ...withFiles(compat.extends('plugin:testing-library/react'), [
    '**/__tests__/**test.tsx',
  ]),
  {
    files: ['./app/src/**/*.{ts,tsx}'],

    rules: {
      'opentrons/no-imports-up-the-tree-of-life': 'error',
      'opentrons/no-direct-mutating': 'error',
      'opentrons/no-imports-across-applications': 'error',
      'opentrons/no-margins-in-css': 'warn',
      'opentrons/no-margins-inline': 'warn',
    },
  },
  {
    files: ['./protocol-designer/src/**/*.{ts,tsx}'],

    rules: {
      'opentrons/no-imports-up-the-tree-of-life': 'warn',
      'opentrons/no-margins-in-css': 'warn',
      'opentrons/no-margins-inline': 'warn',
      '@eslint-react/no-nested-component-definitions': 'error',
    },
  },
  {
    files: ['./opentrons-ai-client/src/**/*.{ts,tsx}'],

    rules: {
      'opentrons/no-imports-up-the-tree-of-life': 'warn',
      'opentrons/no-margins-in-css': 'warn',
      'opentrons/no-margins-inline': 'warn',
    },
  },
  {
    files: ['./components/src/**/*.{ts,tsx}'],

    rules: {
      'opentrons/no-margins-in-css': 'warn',
      'opentrons/no-margins-inline': 'warn',
    },
  },
  {
    files: ['./protocol-visualization/src/**/*.{ts,tsx}'],

    rules: {
      'opentrons/no-imports-up-the-tree-of-life': 'warn',
      'opentrons/no-margins-in-css': 'warn',
      'opentrons/no-margins-inline': 'warn',
      '@eslint-react/no-nested-component-definitions': 'error',
    },
  },
  ...compat.extends('plugin:json/recommended').map(config => ({
    ...config,
    files: ['**/*.json'],
    languageOptions: {
      ...config.languageOptions,
      parser: undefined,
      parserOptions: {},
    },
  })),
  globalIgnores([
    '**/node_modules/**/*',
    '**/coverage/**/*',
    '**/dist/**/*',
    '**/lib/**/*',
    '**/build/**/*',
    '**/venv/**/*',
    '**/.opentrons_config',
    '**/tsconfig*.json',
    '**/package.json',
    '**/pnpm-lock.yaml',
    '**/CHANGELOG.md',
    '!api/release-notes.md',
    '!app-shell/build/release-notes.md',
    '**/storybook-static',
    'js-package-testing/pack/**/*',
    'js-package-testing/test-results/**/*',
    '**/.mypy_cache/**/*',
    '**/.pytest_cache/**/*',
    'api/**/*',
    'update-server/**/*',
    'robot-server/**/*',
    'shared-data/python/**/*',
    'hardware-testing/**/*',
    'abr-testing/protocols/**/*',
    'analyses-snapshot-testing/files',
    'analyses-snapshot-testing/tests/__snapshots__',
    'analyses-snapshot-testing/analysis_results',
    'analyses-snapshot-testing/chunks',
    'opentrons-ai-server/package',
    'opentrons-ai-server/api/storage/',
    'docs/**/site/**/*',
    'docs/**/*.md',
    '.cursor/skills/docs/SKILL.md',
    'docs/**/*.yml',
    '**/*.css',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
    '**/*.webp',
    '.prettierrc.js',
    'eslint.config.js',
    '.stylelintrc.js',
    '.oxlintrc.json',
    '.cursor/**',
    '.github/actions/**/package-lock.json',
  ]),
  ...oxlint.configs['flat/recommended'],
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
])
