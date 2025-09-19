// after the app is packaged and before it is signef, on osx build in python
'use strict'

const eblib = require('builder-util')
const installPython = require('./python-install')
const path = require('path')

module.exports = function afterPack(context) {
  const {
    platform,
    arch,
    electronPlatformName,
    outDir,
    appOutDir,
    packager,
  } = context
  const archStr = eblib.Arch[arch]
  console.log('after-pack: context', context)
  console.log(
    `after-pack: outDir: ${outDir}, applicationOutDir: ${appOutDir}, archStr ${archStr}`
  )
  const platformName = electronPlatformName ?? platform.nodeName
  // arch 4 is universal. sorry. it's not in the arch enum of the builder-util we have for some reason.
  if (platformName === 'darwin') {
    if (arch !== 4) {
      console.log(
        `After-pack: on darwin we only pack python on final universal app creation, not intermediate ${archStr} app creation`
      )
      return true
    } else {
      const appBase = path.join(
        appOutDir,
        `${packager.appInfo.productFilename}.app`
      )
      console.log(
        `After-pack: Packing python for darwin/universal as darwin/x64 to ${appBase}`
      )
      return installPython(platformName, ['x64'], appBase)
    }
  } else {
    console.log(
      `After-pack: Packing python for ${platformName}/${archStr} to ${appOutDir}`
    )
    return installPython(platformName, [archStr], appOutDir)
  }
}
