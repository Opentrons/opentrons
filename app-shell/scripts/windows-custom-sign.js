// from https://github.com/electron-userland/electron-builder/issues/7605

'use strict'

const { execSync } = require('node:child_process')

exports.default = async configuration => {
  try {
    const cmd = `smctl sign --fingerprint="${
      process.env.SM_CODE_SIGNING_CERT_SHA1_HASH
    }" --input "${String(
      configuration.path
    )}" --exit-non-zero-on-fail --failfast --verbose`
    console.log(cmd)
    try {
       const process = execSync(cmd, {
         stdio: 'pipe',
       })
    } catch (err) {
      console.log(`Exception running sign: ${err.code}`)
    }
    const stdout = process.stdout.read()
    const stderr = process.stderr.read()
    console.log(`Sign stdout: ${stdout.toString()}`)
    console.log(`Sign stderr: ${stderr.toString()}`)
    console.log(`Sign code: ${process.code}`)
}
