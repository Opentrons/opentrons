// from https://github.com/electron-userland/electron-builder/issues/7605

'use strict'

const { execSync } = require('node:child_process')

exports.default = async configuration => {
  const { WINDOWS_SIGN } = process.env
  if (WINDOWS_SIGN !== 'true') {
    return
  }
  const signCmd = `smctl sign --keypair-alias="${String(
    process.env.SM_KEYPAIR_ALIAS
  )}" --input "${String(configuration.path)}" --certificate="${String(
    process.env.WINDOWS_CSC_FILEPATH
  )}" --exit-non-zero-on-fail --failfast --verbose`
  console.log(signCmd)
  try {
    const signProcess = execSync(signCmd, {
      stdio: 'pipe',
    })
    console.log(`Sign success!`)
    console.log(
      `Sign stdout: ${signProcess?.stdout?.toString() ?? '<no output>'}`
    )
    console.log(
      `Sign stderr: ${signProcess?.stderr?.toString() ?? '<no output>'}`
    )
    console.log(`Sign code: ${signProcess.code}`)
  } catch (err) {
    console.error(`Exception running sign: ${err.status}!
Process stdout:
 ${err?.stdout?.toString() ?? '<no output>'}
-------------
Process stderr:
${err?.stdout?.toString() ?? '<no output>'}
-------------
`)
    throw err
  }
  const verifyCmd = `smctl sign verify --fingerprint="${String(
    process.env.SM_CODE_SIGNING_CERT_SHA1_HASH
  )}" --input="${String(configuration.path)}" --verbose`
  console.log(verifyCmd)
  try {
    const verifyProcess = execSync(verifyCmd, { stdio: 'pipe' })
    console.log(`Verify success!`)
    console.log(
      `Verify stdout: ${verifyProcess?.stdout?.toString() ?? '<no output>'}`
    )
    console.log(
      `Verify stderr: ${verifyProcess?.stderr?.toString() ?? '<no output>'}`
    )
  } catch (err) {
    console.error(`
Exception running verification: ${err.status}!
Process stdout:
 ${err?.stdout?.toString() ?? '<no output>'}
--------------
Process stderr:
 ${err?.stderr?.toString() ?? '<no output>'}
--------------
`)
    throw err
  }
}
