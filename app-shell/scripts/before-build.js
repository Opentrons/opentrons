// before the app is built, download standalone Python
'use strict'

const path = require('path')
const download = require('download')
const decompress = require('decompress')
const crypto = require('crypto')
const execa = require('execa')

const HOST_PYTHON = process.env.HOST_PYTHON ?? 'python3.10'

const PYTHON_BY_PLATFORM = {
  darwin: {
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-apple-darwin-install_only.tar.gz',
      sha256:
        'ec2e90b6a589db7ef9f74358b1436558167629f9e4d725c8150496f9cb08a9d4',
    },
  },
  linux: {
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-unknown-linux-gnu-install_only.tar.gz',
      sha256:
        'b9989411bed71ba4867538c991f20b55f549dd9131905733f0df9f3fde81ad1d',
    },
  },
  win32: {
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-pc-windows-msvc-static-install_only.tar.gz',
      sha256:
        '3c3e6212fc983640bbe85b9cc60514f80d885892e072d43017b73e1b50a7ad02',
    },
  },
}

const PYTHON_DESTINATION = path.join(__dirname, '..')
const PYTHON_POST_EXTRACT_LOCATION = path.join(PYTHON_DESTINATION, 'python')

module.exports = function beforeBuild(context) {
  const { platform, arch } = context
  const platformName = platform.nodeName
  const standalonePython = PYTHON_BY_PLATFORM?.[platformName]?.[arch]

  if (standalonePython == null) {
    console.warn(`No standalone Python found for ${platformName}+${arch}`)
    return Promise.resolve()
  }

  const { url, sha256 } = standalonePython

  console.log(
    `Downloading standalone Python for ${platformName}+${arch} from ${url}`
  )

  return download(standalonePython.url)
    .then(data => {
      const hasher = crypto.createHash('sha256')
      hasher.update(data)
      const downloadHash = hasher.digest('hex')

      if (downloadHash !== sha256) {
        throw new Error(
          `SHA256 mismatch; expected ${sha256}, got ${downloadHash}`
        )
      }

      console.log(`Standalone Python SHA256: ${downloadHash}`)
      return decompress(data, PYTHON_DESTINATION)
    })
    .then(() => {
      console.log('Standalone Python extracted, installing `opentrons` package')

      return execa(
        HOST_PYTHON,
        [
          '-m',
          'pip',
          'install',
          '--user',
          '--use-feature=in-tree-build',
          path.join(__dirname, '../../shared-data/python'),
          path.join(__dirname, '../../api'),
        ],
        {
          env: {
            PYTHONUSERBASE: PYTHON_POST_EXTRACT_LOCATION,
          },
        }
      )
    })
    .then(() => {
      console.log("`opentrons` package installed to app's Python environment")
      // must return a truthy value, or else electron-builder will
      // skip installing project dependencies into the package
      return true
    })
}
