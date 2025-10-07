// before the app is built, download standalone Python
'use strict'

const path = require('path')
const nodeUrl = require('url')
const download = require('download')
const decompress = require('decompress')
const crypto = require('crypto')
const execa = require('execa')
const fsPromises = require('fs/promises')
const fs = require('fs')

const USE_PYTHON = process.env.NO_PYTHON !== 'true'

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

const PYTHON_BASE_URL =
  'https://github.com/astral-sh/python-build-standalone/releases/download/20250529/'
// fallback options needed because electron builder does not provide a real arch as an argument in the beforePack script
const PYTHON_BY_PLATFORM = {
  darwin: {
    fallback: {
      file:
        'cpython-3.10.17+20250529-x86_64-apple-darwin-install_only_stripped.tar.gz',
      sha256:
        'cb45a45bcbdf00a4808f48fbf344f597a01e66c5ed83a7e388883c86844bd2f1',
    },
    arm64: {
      file:
        'cpython-3.10.17+20250529-aarch64-apple-darwin-install_only_stripped.tar.gz',
      sha256:
        '366d037181b1cea0a7a8b1457874a0cdfbb795815d07ae25c55ef1461aa487ef',
    },
    x64: {
      file:
        'cpython-3.10.17+20250529-x86_64-apple-darwin-install_only_stripped.tar.gz',
      sha256:
        'cb45a45bcbdf00a4808f48fbf344f597a01e66c5ed83a7e388883c86844bd2f1',
    },
  },
  linux: {
    fallback: {
      file:
        'cpython-3.10.17+20250529-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz',
      sha256:
        'e3abc6e300ccdfe5e8faf220d0682dc8eae4d438b96b7d312b32d50a4e536d21',
    },
    x64: {
      file:
        'cpython-3.10.17+20250529-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz',
      sha256:
        'e3abc6e300ccdfe5e8faf220d0682dc8eae4d438b96b7d312b32d50a4e536d21',
    },
    arm64: {
      file:
        'cpython-3.10.17+20250529-aarch64-unknown-linux-gnu-install_only_stripped.tar.gz',
      sha256:
        'aaf1fd370ab3ae31807c8d7d5aff0b8d2abb370c12d17a561178ceb842314f2a',
    },
  },
  win32: {
    fallback: {
      file:
        'cpython-3.10.17+20250529-x86_64-pc-windows-msvc-install_only_stripped.tar.gz',
      sha256:
        '775558a9ad71d42afb168ff76f6db6fa4bf512e933b888e55c8f0557860eac83',
    },
    x64: {
      file:
        'cpython-3.10.17+20250529-x86_64-pc-windows-msvc-install_only_stripped.tar.gz',
      sha256:
        '775558a9ad71d42afb168ff76f6db6fa4bf512e933b888e55c8f0557860eac83',
    },
  },
}

/**
 * The python install process works like this:
 * - A python portable redistributable from the astral portable redistributable project
 *   https://github.com/astral-sh/python-build-standalone for the correct system and architecture
 *   gets downloaded to a reasonably persistent (not removed by make clean) cache. This is the
 *   download step.
 * - The redistributable is unpacked to a "staging" location, which should be cleaned before each build,
 *   and we run a pip install _using the redistributable's pip_ and targeting the redistributable's package
 *   library directory. This is a little easier than jumping through the hoops to cross-install packages, but
 *   it does mean builds must be on the host arch.
 * - The staging location's version of the distributable, which now includes all python packages necessary to
 *   run the analysis cli, gets moved to the in-process app distributable's resource directory (which is platform
 *   specific) with an arch prefix. The arch prefix is mostly useless but is important for the universal app.
 * - Most of the time this will just be for the architecture running the build, but on OSX we install both x64 and
 *   arm64 (AArch64) versions. This means that osx universal apps can only really be built on arm macs, since they
 *   can run x64 code but x64 code can't run aarch64 code.
 *
 * This all has to work like this for the benefit of the universal app builders, because the electron universal app
 * builder works by building an x64 app and an arm64 app and then packing them together, stapling all the mach-o
 * executables and dylibs together using an apple tool to make so-called "fat binaries" or "universal binaries" and
 * unifying any other-than-executable code by just, well, hoping they're the same. This process fails if a non-binary
 * file differs by-hash, with a tight allowlist, between the x64 and arm64 packaged apps. This can be overrridden but
 * only for files in the asars, which the python distributables are not; and the python distributables are not just
 * interpreter binaries but also the generated header packages that are necessary for installing native code python
 * packages, which we want to have the capability to do so users can replicate their robot environment.
 *
 * So we're stuck with installing both architectures of python distributable to different subdirectories inside the
 * app resources, and we have to do it after electron's app packaging process ends, directly into the universal app
 * package. Terrific!
 * */

const PYTHON_BASE = path.join(__dirname, '..', 'python')
const PYTHON_STAGING_BASE = path.join(PYTHON_BASE, 'staging')
const pythonStaging = arch => path.join(PYTHON_STAGING_BASE, 'python', arch)
const pythonSitePackagesStagingPosix = arch =>
  path.join(pythonStaging(arch), 'lib', 'python3.10', 'site-packages')
const pythonSitePackagesStagingWindows = arch =>
  path.join(pythonStaging(arch), 'Lib', 'site-packages')
const pythonSitePackagesStaging = (platform, arch) =>
  platform === 'win32'
    ? pythonSitePackagesStagingWindows(arch)
    : pythonSitePackagesStagingPosix(arch)
const executablePython = (platform, arch) =>
  platform === 'win32'
    ? path.join(pythonStaging(arch), 'python.exe')
    : path.join(pythonStaging(arch), 'bin', 'python3.10')

const PYTHON_DOWNLOAD_BASE = path.join(PYTHON_BASE, 'download')
const pythonDownloadDestination = (arch, platform) =>
  path.join(PYTHON_DOWNLOAD_BASE, platform, arch)

const pythonTarget = (platform, arch, appDir) => {
  switch (platform) {
    case 'win32':
      return path.join(appDir, 'resources', 'python', arch)
    case 'darwin':
      return path.join(appDir, 'Contents', 'Resources', 'python', arch)
    case 'linux':
      return path.join(appDir, 'resources', 'python', arch)
  }
}

const hashFile = path =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(path)
    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })

const ensure = (shastr, filepath) =>
  new Promise((resolve, reject) => {
    if (fs.existsSync(filepath)) {
      resolve()
    } else {
      reject(new Error(`no cached file ${filepath}`))
    }
  })
    .then(_ => hashFile(filepath))
    .then(digest => {
      if (digest !== shastr) {
        throw new Error(
          `Hash mismatch for ${filepath}: expected ${shastr} but digest was ${digest}`
        )
      }
    })

function pythonInstallOne(platformName, archStr, targetDir) {
  const log = logMessage => {
    logMessage
      .split(/\r?\n/)
      .forEach(logline => console.log(`[pythonInstall ${archStr}] ${logline}`))
  }
  const standalonePython = getPythonVersion(platformName, archStr)
  if (standalonePython == null) {
    throw new Error(`No standalone Python found for ${platformName}+${archStr}`)
  }
  const { file, sha256 } = standalonePython
  const url = new nodeUrl.URL(file, PYTHON_BASE_URL)

  log(
    `Downloading standalone Python for ${platformName}+${archStr} from ${url}`
  )
  const downloadPath = path.join(
    pythonDownloadDestination(archStr, platformName),
    file
  )

  return Promise.all([
    fsPromises.rm(pythonStaging(archStr), { recursive: true, force: true }),
    ensure(standalonePython.sha256, downloadPath)
      .then(() => {
        log(
          `Found standalone Python for ${platformName}+${archStr} at ${downloadPath}`
        )
      })
      .catch(err => {
        log(
          `Downloading new python for ${platformName}+${archStr} to ${downloadPath} because ${err}`
        )
        return download(url).then(data => {
          const hasher = crypto.createHash('sha256')
          hasher.update(data)
          const downloadHash = hasher.digest('hex')

          if (downloadHash !== sha256) {
            throw new Error(
              `Standalone Python SHA256 mismatch; expected ${sha256}, got ${downloadHash}`
            )
          }

          log(`Standalone Python SHA256: ${downloadHash} matches OK`)
          return fsPromises
            .mkdir(pythonDownloadDestination(archStr, platformName), {
              recursive: true,
            })
            .then(() => fsPromises.writeFile(downloadPath, data))
        })
      }),
  ])
    .then(() => {
      log(`Creating python staging dir ${pythonStaging(archStr)}`)
      return fsPromises.mkdir(pythonStaging(archStr), { recursive: true })
    })
    .then(() => {
      log(
        `Decompressing standalone python artifact ${downloadPath} to ${pythonStaging(
          archStr
        )}`
      )
      return decompress(downloadPath, pythonStaging(archStr), {
        strip: 1,
      })
    })
    .then(() => {
      log(
        'Standalone Python extracted, installing `opentrons` and `pandas` packages'
      )

      const sitePackages = pythonSitePackagesStaging(platformName, archStr)

      const invokablePython = executablePython(platformName, archStr)
      // TODO(mc, 2022-05-16): explore virtualenvs for a more reliable
      // implementation of this install
      log(`Installing python native deps using ${invokablePython}`)

      return execa(invokablePython, [
        '-m',
        'pip',
        'install',
        `--target=${sitePackages}`,
        path.join(__dirname, '..', '..', 'shared-data'),
        path.join(__dirname, '..', '..', 'hardware[flex]'),
        path.join(__dirname, '..', '..', 'api'),
        'pandas==1.4.3',
      ])
    })
    .then(({ stdout }) => {
      log(
        '`opentrons` and `pandas` packages installed to Python staging environment'
      )
      log('pip output:', stdout)
      log(
        `Making directory for python tree in ${path.dirname(
          pythonTarget(platformName, archStr, targetDir)
        )}`
      )
      return fsPromises.mkdir(
        path.dirname(pythonTarget(platformName, archStr, targetDir)),
        { recursive: true }
      )
    })
    .then(() => {
      log(
        `Installing python tree at ${pythonStaging(
          archStr
        )} to target ${pythonTarget(platformName, archStr, targetDir)}`
      )
      fsPromises.rename(
        pythonStaging(archStr),
        pythonTarget(platformName, archStr, targetDir)
      )
    })
}

module.exports = function pythonInstall(platformName, archStrs, targetDir) {
  if (!USE_PYTHON) {
    return Promise.resolve(true)
  }
  return Promise.all(
    archStrs.map(archStr => pythonInstallOne(platformName, archStr, targetDir))
  ).then(() => {
    // must return a truthy value, or else electron-builder will
    // skip installing project dependencies into the package
    return true
  })
}
