'use strict'

module.exports = {
  appId: 'com.opentrons.odd',
  electronVersion: '39.1.2',
  npmRebuild: false,
  electronLanguages: ['en-US', 'zh-CN'],
  files: [
    'lib/*',
    'node_modules/**/*',
    'package.json',
    '!Makefile',
    '!**/.venv/**',
    '!**/*.py',
    '!**/py.typed',
    '!**/shared-data/**/*.json',
    '!**/shared-data/**/*.jpg',
    '!**/shared-data/**/*.png',
    {
      from: '../app/dist',
      to: './ui',
      filter: ['**/*'],
    },
  ],
  /* eslint-disable no-template-curly-in-string */
  artifactName: '${productName}-v${version}-${os}-${env.BUILD_ID}.${ext}',
  /* eslint-enable no-template-curly-in-string */
  asar: true,
  linux: {
    target: ['dir'],
    executableName: 'opentrons',
    category: 'Science',
  },
}
