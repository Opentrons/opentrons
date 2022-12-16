'use strict'
const path = require('path')
const { versionForProject } = require('../scripts/git-version')

const { OT_APP_DEPLOY_BUCKET, OT_APP_DEPLOY_FOLDER } = process.env
const DEV_MODE = process.env.NODE_ENV !== 'production'
const USE_PYTHON = process.env.NO_PYTHON !== 'true'
const NO_USB_DETECTION = process.env.NO_USB_DETECTION === 'true'
const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'

module.exports = async () => ({
  appId:
    project === 'robot-stack' ? 'com.opentrons.app' : 'com.opentrons.appot3',
  electronVersion: '21.3.1',
  files: [
    '**/*',
    'build/br-premigration-wheels',
    '!Makefile',
    '!python',
    NO_USB_DETECTION ? '!node_modules/usb-detection' : '',
    {
      from: '../app/dist',
      to: './ui',
      filter: ['**/*'],
    },
  ],
  extraMetadata: {
    version: await versionForProject(project),
    productName: project === 'robot-stack' ? 'Opentrons' : 'Opentrons-OT3',
  },
  extraResources: USE_PYTHON ? ['python'] : [],
  /* eslint-disable no-template-curly-in-string */
  artifactName: '${productName}-v${version}-${os}-${env.BUILD_ID}.${ext}',
  /* eslint-enable no-template-curly-in-string */
  asar: true,
  mac: {
    target: process.platform === 'darwin' ? ['dmg', 'zip'] : ['zip'],
    category: 'public.app-category.productivity',
    type: DEV_MODE ? 'development' : 'distribution',
    icon: project === 'robot-stack' ? 'build/icon.icns' : 'build/three.icns',
    strictCodeSigning: true,
    forceCodeSigning: true,
    gatekeeperAssess: true,
  },
  dmg: {
    icon: null,
  },
  win: {
    target: ['nsis'],
    publisherName: 'Opentrons Labworks Inc.',
    icon: project === 'robot-stack' ? 'build/icon.ico' : 'build/three.ico',
  },
  nsis: {
    oneClick: false,
  },
  linux: {
    target: ['AppImage'],
    executableName: 'opentrons',
    category: 'Science',
    icon: project === 'robot-stack' ? 'build/icon.icns' : 'build/three.icns',
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
  beforeBuild: path.join(__dirname, './scripts/before-build.js'),
  afterSign: path.join(__dirname, './scripts/after-sign.js'),
})
