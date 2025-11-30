'use strict'

const importOrder = [
  '^(react)(.*)$',
  '<THIRD_PARTY_MODULES>',
  '',
  '^@opentrons/(.*)$',
  '',
  '^/(.*)/(?!assets)(.*)$',
  '',
  '^[./](?!.*\\.(png|jpg|jpeg|gif|svg|webm|mp4)$)',
  '',
  '<TYPES>',
  '<TYPES>^(react)(.*)$',
  '<TYPES><THIRD_PARTY_MODULES>',
  '<TYPES>^@opentrons/(.*)$',
  '<TYPES>^/(.*)/(?!assets)(.*)$',
  '<TYPES>^[./]',
  '',
  '.*/assets/.*',
  '.*\\.(png|jpg|jpeg|gif|svg|webm|mp4)$',
]

module.exports = {
  // --- GLOBAL CONFIG (Applies to all files: JSON, MD, YAML, JS, TS) ---
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',

  overrides: [
    {
      // apply the plugin following only to JS/TS files
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      options: {
        plugins: ['@ianvs/prettier-plugin-sort-imports'],
        importOrder,
        importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
      },
    },
    {
      files: ['*.d.ts'],
      options: {
        plugins: []
      }
    }
  ],
}