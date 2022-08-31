// before the app is built, download standalone Python
'use strict'

const path = require('path')
const download = require('download')
const decompress = require('decompress')
const crypto = require('crypto')
const execa = require('execa')
const USE_PYTHON = process.env.NO_PYTHON !== 'true'

const HOST_PYTHON = process.env.HOST_PYTHON ?? 'python3.10'

const PYTHON_BY_PLATFORM = {
  darwin: {
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220502/cpython-3.10.4+20220502-x86_64-apple-darwin-install_only.tar.gz',
      sha256:
        'f2711eaffff3477826a401d09a013c6802f11c04c63ab3686aa72664f1216a05',
    },
  },
  linux: {
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220502/cpython-3.10.4+20220502-x86_64-unknown-linux-gnu-install_only.tar.gz',
      sha256:
        'f6f871e53a7b1469c13f9bd7920ad98c4589e549acad8e5a1e14760fff3dd5c9',
    },
  },
  win32: {
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220502/cpython-3.10.4+20220502-x86_64-pc-windows-msvc-shared-install_only.tar.gz',
      sha256:
        'bee24a3a5c83325215521d261d73a5207ab7060ef3481f76f69b4366744eb81d',
    },
  },
}

const PYTHON_DESTINATION = path.join(__dirname, '..')
const PYTHON_SITE_PACKAGES_TARGET_POSIX = 'python/lib/python3.10/site-packages'
const PYTHON_SITE_PACKAGES_TARGET_WINDOWS = 'python/Lib/site-packages'

module.exports = function beforeBuild(context) {
  const { platform, arch } = context
  const platformName = platform.nodeName
  const standalonePython = PYTHON_BY_PLATFORM?.[platformName]?.[arch]
  if (!USE_PYTHON) {
    return Promise.resolve(true)
  }
  if (standalonePython == null) {
    throw new Error(`No standalone Python found for ${platformName}+${arch}`)
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
      console.log(
        'Standalone Python extracted, installing `opentrons` and `pandas` packages'
      )

      const sitePackages =
        platformName === 'win32'
          ? PYTHON_SITE_PACKAGES_TARGET_WINDOWS
          : PYTHON_SITE_PACKAGES_TARGET_POSIX

      // TODO(mc, 2022-05-16): explore virtualenvs for a more reliable
      // implementation of this install
      return execa(HOST_PYTHON, [
        '-m',
        'pip',
        'install',
        `--target=${path.join(PYTHON_DESTINATION, sitePackages)}`,
        path.join(__dirname, '../../shared-data/python'),
        path.join(__dirname, '../../api'),
        'pandas==1.4.1',
      ])
    })
    .then(({ stdout }) => {
      console.log(
        "`opentrons` and `pandas` packages installed to app's Python environment"
      )
      console.debug('pip output:', stdout)
      // must return a truthy value, or else electron-builder will
      // skip installing project dependencies into the package
      return true
    })
}
