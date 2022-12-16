'use strict'

const path = require('path')
const { notarize } = require('electron-notarize')

const { APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID } = process.env
const DEV_MODE = process.env.NODE_ENV !== 'production'
const PLATFORM_DARWIN = 'darwin'

module.exports = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context
  if (
    process.platform !== PLATFORM_DARWIN ||
    electronPlatformName !== PLATFORM_DARWIN
  ) {
    console.log(
      'Not running on and/or building for macOS; skipping notarization'
    )
    return
  }

  if (DEV_MODE) {
    console.log('Not in a production environment; skipping notarization')
    return
  }

  if (!APPLE_ID || !APPLE_ID_PASSWORD) {
    console.warn(
      'No Apple Account credentials available; skipping notarization'
    )
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)

  console.log(`Submitting app for notarization: ${appPath}`)

  return await notarize({
    tool: 'notarytool',
    appleId: APPLE_ID,
    appleIdPassword: APPLE_ID_PASSWORD,
    teamId: APPLE_TEAM_ID,
    appPath,
  })
}
