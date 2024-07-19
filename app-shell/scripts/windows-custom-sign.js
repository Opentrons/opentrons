// from https://github.com/electron-userland/electron-builder/issues/7605

'use strict'

const { execSync } = require('node:child_process')

exports.default = async configuration => {
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
    const stdout = process.stdout.read()
    const stderr = process.stderr.read()
    console.log(`Sign stdout: ${stdout.toString()}`)
    console.log(`Sign stderr: ${stderr.toString()}`)
    console.log(`Sign code: ${process.code}`)
  } catch (err) {
    console.error(
      `Exception running sign: ${
        err.status
      }! Output: ${err.stdout.toString()} Error: ${err.stdout.toString()}`
    )
    throw err
  }
}
