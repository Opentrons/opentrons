// before the app is built, download standalone Python
'use strict'

const path = require('path')
const download = require('download')
const decompress = require('decompress')
const crypto = require('crypto')
const execa = require('execa')
const USE_PYTHON = process.env.NO_PYTHON !== 'true'

const HOST_PYTHON = process.env.HOST_PYTHON ?? 'python3.10'

const getPythonVersion = (platformName, arch) => {
  const pythonForPlatform = PYTHON_BY_PLATFORM[platformName]
  if (pythonForPlatform != null) {
    if (pythonForPlatform[arch] != null) {
      return pythonForPlatform[arch]
    } else {
      console.warn(
        `could not find Python version for platform ${platformName} with arch ${arch}. Falling back to Python for ${platformName} with arch x64`
      )
      return pythonForPlatform.fallback
    }
  }
  return null
}

// fallback options needed because electron builder does not provide a real arch as an argument in the beforePack script
const PYTHON_BY_PLATFORM = {
  darwin: {
    fallback: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-apple-darwin-install_only.tar.gz',
      sha256:
        'ec2e90b6a589db7ef9f74358b1436558167629f9e4d725c8150496f9cb08a9d4',
    },
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-apple-darwin-install_only.tar.gz',
      sha256:
        'ec2e90b6a589db7ef9f74358b1436558167629f9e4d725c8150496f9cb08a9d4',
    },
  },
  linux: {
    fallback: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-unknown-linux-gnu-install_only.tar.gz',
      sha256:
        'b9989411bed71ba4867538c991f20b55f549dd9131905733f0df9f3fde81ad1d',
    },
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-unknown-linux-gnu-install_only.tar.gz',
      sha256:
        'b9989411bed71ba4867538c991f20b55f549dd9131905733f0df9f3fde81ad1d',
    },
  },
  win32: {
    fallback: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-pc-windows-msvc-shared-install_only.tar.gz',
      sha256:
        'ba593370742ed8a7bc70ce563dd6a53e30ece1f6881e3888d334c1b485b0d9d0',
    },
    x64: {
      url:
        'https://github.com/indygreg/python-build-standalone/releases/download/20220318/cpython-3.10.3+20220318-x86_64-pc-windows-msvc-shared-install_only.tar.gz',
      sha256:
        'ba593370742ed8a7bc70ce563dd6a53e30ece1f6881e3888d334c1b485b0d9d0',
    },
  },
}

const PYTHON_DESTINATION = path.join(__dirname, '..')
const PYTHON_SITE_PACKAGES_TARGET_POSIX = 'python/lib/python3.10/site-packages'
const PYTHON_SITE_PACKAGES_TARGET_WINDOWS = 'python/Lib/site-packages'

module.exports = function beforeBuild(context) {
  const { platform, arch, electronPlatformName } = context
  const platformName = electronPlatformName ?? platform.nodeName
  const standalonePython = getPythonVersion(platformName, arch)
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
        path.join(__dirname, '../../hardware[flex]'),
        path.join(__dirname, '../../api'),
        'pandas==1.4.3',
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
