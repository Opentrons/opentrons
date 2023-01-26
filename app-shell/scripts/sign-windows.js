'use strict'
const path = require('path')
const { mkdtemp, open } = require('fs/promises')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

exports.default = async function (configuration) {
  const { toSignPath = path, cscInfo } = configuration
  if (!Object.hasOwnProperty(configuration, 'cscInfo')) {
    console.log('No codesign configuration, not signing')
    return
  }
  const { file, password } = cscInfo
  const certContent = atob(file)
  const tempdir = mkdtemp('keyfile')
  const certTempPath = path.join(tempdir, 'key.pfx')
  const certFile = await open(certTempPath)
  await certFile.writeFile(certContent)
  await certFile.close()

  await exec(
    `Set-AuthenticodeSignature -Certificate $(Get-PfxCertificate -FilePath ${certTempPath} -Password ${password} ) -FilePath ${toSignPath}`,
    {
      stdio: 'inherit',
    }
  )
}
