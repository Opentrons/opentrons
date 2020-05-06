'use strict'
const path = require('path')

const { OT_APP_DEPLOY_BUCKET, OT_APP_DEPLOY_FOLDER } = process.env
const DEV_MODE = process.env.NODE_ENV !== 'production'

module.exports = {
  appId: 'com.opentrons.app',
  electronVersion: '6.1.10',
  files: [
    '**/*',
    {
      from: '../app/dist',
      to: './ui',
      filter: ['**/*'],
    },
    'build/release-notes.md',
    'build/br-premigration-wheels',
    '!Makefile',
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
  publish:
    OT_APP_DEPLOY_BUCKET && OT_APP_DEPLOY_FOLDER
      ? {
          provider: 's3',
          bucket: OT_APP_DEPLOY_BUCKET,
          path: OT_APP_DEPLOY_FOLDER,
        }
      : null,
  generateUpdatesFilesForAllChannels: true,
  afterSign: path.join(__dirname, './scripts/after-sign.js'),
}
