// from https://github.com/electron-userland/electron-builder/issues/7605

'use strict'

const { execSync } = require('node:child_process')

exports.default = async configuration => {
  try {
    execSync(
      `smctl sign --fingerprint="${
        process.env.SM_CODE_SIGNING_CERT_SHA1_HASH
      }" --input "${String(configuration.path)}"`,
      {
        stdio: 'inherit',
      }
    )
    console.log(
      `Signed ${configuration.path} with ${process.env.SM_CODE_SIGNING_CERT_SHA1_HASH}`
    )
  } catch (error) {
    console.error(`Signing ${configuration.path}: failed:`, error)
  }
}
