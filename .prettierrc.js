'use strict'

module.exports = {
  printWidth: 80, // default
  tabWidth: 2, // default
  useTabs: false, // default
  semi: false,
  singleQuote: true,
  jsxSingleQuote: false, // default
  trailingComma: 'es5',
  bracketSpacing: true, // default
  jsxBracketSameLine: false, // default
  arrowParens: 'avoid', // default
  endOfLine: 'lf',
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
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
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
}
