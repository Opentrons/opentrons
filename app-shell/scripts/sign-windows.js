'use strict'
const path = require('path')
const { mkdtemp, open } = require('fs/promises')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const certEncodedContent = process.env.WIN_CSC_LINK
const certPassword = process.env.WIN_CSC_KEY_PASSWORD

exports.default = async function (configuration) {
  const { toSignPath = path } = configuration
  console.log(`Signing ${toSignPath} using powershell commandlets`)
  const certContent = atob(certEncodedContent)
  const tempdir = await mkdtemp('keyfile')
  const certTempPath = path.join(tempdir, 'key.pfx')
  const certFile = await open(certTempPath)
  await certFile.writeFile(certContent)
  await certFile.close()

  await exec(
    `Set-AuthenticodeSignature -Certificate $(Get-PfxCertificate -FilePath ${certTempPath} -Password ${certPassword} ) -FilePath ${toSignPath}`,
    {
      stdio: 'inherit',
    }
  )
}
