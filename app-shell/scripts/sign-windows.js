'use strict'
const { join } = require('path')
const { mkdtemp, open } = require('fs/promises')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

exports.default = async function (configuration) {
  if (!Object.hasOwnProperty(process.env, 'WIN_CSC_LINK')) {
    console.log('No certificate, skipping signing')
  }
  const { path } = configuration

  const certEncodedContent = process.env.WIN_CSC_LINK
  const certPassword = process.env.WIN_CSC_KEY_PASSWORD
  console.log(`Signing ${path} using powershell commandlets`)
  const certContent = atob(certEncodedContent)
  const tempdir = await mkdtemp('keyfile')
  const certTempPath = join(tempdir, 'key.pfx')
  const certFile = await open(certTempPath, 'w')
  await certFile.writeFile(certContent)
  await certFile.close()

  await exec(
    `Set-AuthenticodeSignature -Certificate $(Get-PfxCertificate -FilePath ${certTempPath} -Password ${certPassword}) -FilePath ${path}`,
    {
      stdio: 'inherit',
      shell: 'powershell.exe',
    }
  )
}
