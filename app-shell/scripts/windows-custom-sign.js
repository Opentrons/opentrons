// from https://github.com/electron-userland/electron-builder/issues/7605

'use strict'

const { execSync } = require('node:child_process')

exports.default = async configuration => {
  const signCmd = `smctl sign --keypair-alias="${String(
    process.env.SM_KEYPAIR_ALIAS
  )}" --input "${String(
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
    console.error(`Exception running sign: ${err.status}!
Process stdout:
 ${err.stdout.toString()}
-------------
Process stderr:
${err.stdout.toString()}
-------------
`)
    throw err
  }
  const verifyCmd = `smctl sign verify --fingerprint-string="${String(
    process.env.SM_CODE_SIGNING_CERT_SHA1_HASH
  )}" --input="${String(configuration.path)}" --verbose`
  console.log(verifyCmd)
  try {
    const verifyProcess = execSync(verifyCmd, { stdio: 'pipe' })
    const stdout = process.stdout.read()
    const stderr = process.stderr.read()
    console.log(`Verify stdout: ${stdout}`)
    console.log(`Verify stderr: ${stderr}`)
  } catch (err) {
    console.error(`
Exception running verification: ${err.status}!
Process stdout:
 ${err.stdout.toString()}
--------------
Process stderr:
 ${err.stderr.toString()}
--------------
`)
    throw err
  }
}
