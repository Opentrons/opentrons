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
  // --- STANDARD PRETTIER OPTIONS (Global) ---
  // These apply to ALL files (JS, JSON, MD, YAML)
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

  // ⚠️ CRITICAL: NO PLUGINS OR PLUGIN OPTIONS HERE ⚠️
  // If you put importOrder here, JSON/MD files will warn because they don't have the plugin.

  overrides: [
    {
      // --- CONFIGURATION FOR JS/TS ONLY ---
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      options: {
        // 1. Load the plugin ONLY for these files
        // We use require.resolve to satisfy pnpm
        plugins: [require.resolve('@ianvs/prettier-plugin-sort-imports')],

        // 2. Apply the options ONLY for these files
        importOrder,
        importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
      },
    },
    {
      files: ['**/localization/**/*.json'],
      options: {
        plugins: [require.resolve('prettier-plugin-sort-json')],
        jsonRecursiveSort: true,
      },
    },
  ],
}
