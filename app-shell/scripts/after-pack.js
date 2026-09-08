// after the app is packaged and before it is signef, on osx build in python
'use strict'

const eblib = require('builder-util')
const installPython = require('./python-install')
const path = require('path')
const fs = require('fs-extra')

// copy Assets.car
async function copyAssetCar(appOutDir, productFilename) {
  const source = path.join(__dirname, '..', 'build', 'Assets.car')
  if (!(await fs.pathExists(source))) return

  const target = path.join(
    appOutDir,
    `${productFilename}.app`,
    'Contents',
    'Resources',
    'Assets.car'
  )
  await fs.ensureDir(path.dirname(target))
  await fs.copy(source, target)
}

module.exports = async function afterPack(context) {
  const { platform, arch, electronPlatformName, outDir, appOutDir, packager } =
    context
  const archStr = eblib.Arch[arch]
  console.log('after-pack: context', context)
  console.log(
    `after-pack: outDir: ${outDir}, applicationOutDir: ${appOutDir}, archStr ${archStr}`
  )
  const platformName = electronPlatformName ?? platform.nodeName
  // arch 4 is universal. sorry. it's not in the arch enum of the builder-util we have for some reason.
  if (platformName === 'darwin') {
    const productFilename = packager.appInfo.productFilename

    await copyAssetCar(appOutDir, productFilename)

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
      const result = installPython(platformName, ['x64'], appBase)
      console.log(
        `After pack: done after packing python for universal: ${result}`
      )
      return result
    }
  } else {
    console.log(
      `After-pack: Packing python for ${platformName}/${archStr} to ${appOutDir}`
    )
    const result = installPython(platformName, [archStr], appOutDir)
    console.log(`After-pack: done after packing python for one arch: ${result}`)
    return result
  }
}
