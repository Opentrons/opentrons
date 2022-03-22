'use strict'
const path = require('path')

const { OT_APP_DEPLOY_BUCKET, OT_APP_DEPLOY_FOLDER } = process.env
const DEV_MODE = process.env.NODE_ENV !== 'production'

module.exports = {
  appId: 'com.opentrons.app',
  electronVersion: '13.1.8',
  files: [
    '**/*',
    {
      from: '../app/dist',
      to: './ui',
      filter: ['**/*'],
    },
    'build/br-premigration-wheels',
    '!Makefile',
  ],
  extraResources: [
    {
      from: 'python',
      to: 'python',
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
    electronLanguages: ['en'],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: '/build/entitlements.mac.plist',
    binaries: [
      './dist/mac/Opentrons.app/Contents/Resources/python/bin/python3.8',
      './dist/mac/Opentrons.app/Contents/Resources/python/lib/python3.8/lib-dynload/xxlimited.cpython-38-darwin.so',
      './dist/mac/Opentrons.app/Contents/Resources/python/lib/python3.8/lib-dynload/_testcapi.cpython-38-darwin.so',
    ],
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

// TODO: use the hook that does something before building, in that we want to run our own scripts/soanso.js
// download the standalone python based on the process. platform
// we should probably hardcode the shasums in there to be safe and check the tarball against the sum
// extract that tarball into app-shell/python
// then attempt to run `app-shell/python/pip3 install ./shared-data/python ./api` in order to get opentrons module
