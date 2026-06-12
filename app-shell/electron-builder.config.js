'use strict'
const fs = require('fs')
const path = require('path')

const { OT_OT2_APP_DEPLOY_BUCKET, OT_OT2_APP_DEPLOY_FOLDER } = process.env
const DEV_MODE = process.env.NODE_ENV !== 'production'
const USE_PYTHON = process.env.NO_PYTHON !== 'true'
const WINDOWS_SIGN = process.env.WINDOWS_SIGN === 'true'
const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'
const productName =
  project === 'robot-stack' ? 'Opentrons OT-2' : 'Opentrons Internal OT-2'
const MAC_ASSET_CATALOG_PATH = path.join(__dirname, 'build/Assets.car')
const HAS_MAC_ASSET_CATALOG = fs.existsSync(MAC_ASSET_CATALOG_PATH)

// this will generate either
// https://builds.opentrons.com/app/ or https://ot3-development.builds.opentrons.com/app/
// because these environment variables are provided by ci
const publishConfig =
  OT_OT2_APP_DEPLOY_BUCKET && OT_OT2_APP_DEPLOY_FOLDER
    ? {
        provider: 'generic',
        url: `https://${OT_OT2_APP_DEPLOY_BUCKET}/${OT_OT2_APP_DEPLOY_FOLDER}/`,
      }
    : null

module.exports = async () => ({
  productName,
  appId:
    project === 'robot-stack'
      ? 'com.opentrons.appot2'
      : 'com.opentrons.appinternalot2',
  electronVersion: '39.1.2',
  npmRebuild: false,
  protocols: [
    {
      name: 'OT-2 App',
      schemes: ['com-opentrons-ot2-app'],
    },
  ],
  releaseInfo: {
    releaseNotesFile:
      project === 'robot-stack'
        ? 'release-notes.md'
        : 'release-notes-internal.md',
  },
  files: [
    '**/*',
    'build/br-premigration-wheels',
    '!**/.venv',
    '!Makefile',
    '!python',
    '!**/.venv/**',
    {
      from: '../app/dist',
      to: './ui',
      filter: ['**/*'],
    },
  ],
  extraMetadata: {
    version: await (
      await import('../scripts/git-version.mjs')
    ).versionForProject(project),
    productName,
  },
  /* eslint-disable no-template-curly-in-string */
  artifactName: '${productName}-v${version}-${os}-${env.BUILD_ID}.${ext}',
  /* eslint-enable no-template-curly-in-string */
  asar: true,
  mac: {
    target: process.platform === 'darwin' ? ['dmg', 'zip'] : ['zip'],
    category: 'public.app-category.productivity',
    type: DEV_MODE ? 'development' : 'distribution',
    icon: project === 'robot-stack' ? 'build/icon.icns' : 'build/three.icns',
    extendInfo: {
      CFBundleDisplayName: productName,
      ...(HAS_MAC_ASSET_CATALOG ? { CFBundleIconName: 'AppIcon' } : {}),
    },
    forceCodeSigning: !DEV_MODE,
    gatekeeperAssess: true,
    // note: notarize.teamId is passed by implicitly sending through the APPLE_TEAM_ID env var
  },
  dmg: {
    icon: project === 'robot-stack' ? 'build/icon.icns' : 'build/three.icns',
    // The final universal OT-2 app exceeds 1 GiB once the bundled Python
    // runtime is copied in. Use a fixed DMG image size with extra headroom
    // minumizing the dmg size after copying files works so use shrink
    size: '3g',
    shrink: true,
  },
  win: {
    target: ['nsis'],
    icon: project === 'robot-stack' ? 'build/icon.ico' : 'build/three.ico',
    forceCodeSigning: WINDOWS_SIGN,
    azureSignOptions: {
      publisherName: 'OPENTRONS LABWORKS INC.',
      codeSigningAccountName: 'desktop-app-signing',
      certificateProfileName: 'OpentronsDesktopApp',
      endpoint: 'https://eus.codesigning.azure.net',
    },
  },
  nsis: {
    oneClick: false,
    license: 'build/license_en.txt',
  },
  linux: {
    target: ['AppImage'],
    executableName: 'opentrons-ot2',
    category: 'Science',
    icon: project === 'robot-stack' ? 'build/icon.icns' : 'build/three.icns',
  },
  appImage: {
    license: 'build/license_en.txt',
  },
  publish: publishConfig,
  generateUpdatesFilesForAllChannels: true,
  afterPack: path.join(__dirname, './scripts/after-pack.js'),
})
