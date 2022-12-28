'use strict'
const DEV_MODE = process.env.NODE_ENV !== 'production'

module.exports = {
  appId: 'com.opentrons.app',
  electronVersion: '21.3.1',
  files: [
    '**/*',
    'build/br-premigration-wheels',
    '!Makefile',
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
  mac: {
    target: process.platform === 'darwin' ? ['dmg', 'zip'] : ['zip'],
    category: 'public.app-category.productivity',
    type: DEV_MODE ? 'development' : 'distribution',
  },
  dmg: {
    icon: null,
  },
  win: {
    target: ['nsis'],
    publisherName: 'Opentrons Labworks Inc.',
  },
  nsis: {
    oneClick: false,
  },
  linux: {
    target: ['AppImage'],
    executableName: 'opentrons',
    category: 'Science',
  },
  generateUpdatesFilesForAllChannels: true,
}
