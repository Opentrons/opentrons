const childProcess = require('child_process')
const fs = require('fs');
const http = require('http');
const path = require('path')
const os = require('os')

const electron = require('electron')
const {app} = electron
const glob = require('glob')
const rp = require('request-promise')
const urlJoin = require('url-join')

const {downloadFileFromWeb} = require('./util.js')

const STATIC_ASSETS_BASE_URL = process.env.STATIC_ASSETS_BASE_URL || 'http://s3.amazonaws.com/ot-app-builds/server-exes/'
const STATIC_ASSETS_BRANCH = process.env.STATIC_ASSETS_BRANCH || 'stable'

/**
 * Returns path to backend built with electron app
 */
function getBuiltinExecutablePath () {
  const userDataPath = app.getPath('userData')
  console.log('User Data Path', userDataPath)
  let builtinExesMap = {
    'darwin': '/backend-dist/mac/otone_server',
    'linux': '/backend-dist/linux/otone_server',
    'win32': '\\backend-dist\\win\\otone_server.exe'
  }
  if (!(process.platform in builtinExesMap)) {
    console.log('\n\n\n\nunknown OS: ' + process.platform + '\n\n\n\n')
    return null
  }
  let backendPath = app.getAppPath() + builtinExesMap[process.platform]
  return backendPath
}

/**
 * Parses exe version from exe path
 */
function getExeVersion(exePath) {
  if (!exePath.endsWith('.latest')) {
    return app.getVersion()
  }

  // name of exe is based on artifact name convention
  return path.basename(exePath)
    .replace('otone_server-', '')
    .replace('.latest', '')
    .replace('.exe', '')
}

/**
 * Returns path to "latest" executable
 */
function getLatestExecutablePath () {
  const userDataPath = app.getPath('userData')
  let serverExecutablesPath = getServerExecutablesPath()
  return glob.sync(path.join(serverExecutablesPath, '*.latest'))[0] || null
}

/**
 * Returns path to "new" executable
 */
function getNewlyDownloadedExecutablePath () {
  const userDataPath = app.getPath('userData')
  let serverExecutablesPath = getServerExecutablesPath()
  return glob.sync(path.join(serverExecutablesPath, '*.new'))[0] || null
}

/**
 * Returns the path where the 'latest' and 'new' server executables are
 * downloaded and stored
 */
function getServerExecutablesPath () {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'server-executables')
}

/**
 * Renames the 'new' exe to 'latest'
 */
function promoteNewlyDownloadedExeToLatest () {
  return new Promise((resolve, reject) => {
    console.log('[ServerManager] Initiating promotion of new exe to latest')
    const newExePath = getNewlyDownloadedExecutablePath()
    // if we dont have a new exe exit
    if (newExePath === null) {
      console.log('[ServerManager] No "*.new" exe detected; skipping promotion')
      resolve()
    }
    const latestExePath = newExePath.replace('new', 'latest')
    console.log(`[ServerManager] Found new exe: "${newExePath}". Renaming to: "${latestExePath}"`)

    const currentExePath = getLatestExecutablePath()
    try {
      if (currentExePath) fs.unlink(currentExePath)  // Remove old latest
      fs.renameSync(newExePath, latestExePath)  // Mark new exe as latest
    } catch (e) {
      console.log(`[ServerManager] Error renaming exe from ${newExePath} to ${latestExePath}`)
    }
    resolve()
  })
}

function getDownloadInfoForNewBackendServer () {
  /**
   * 1) Get exe name from from file
   * 2) With exe name; download actual exe
   * 3) Save downloaded exe with extension "*.new"
   */
  var processPlatformToS3FolderMap = {
    'darwin': 'mac',
    'win32': 'win',
    'linux': 'linux'
  }

  return new Promise((resolve, reject) => {
    let downloadInfo = {url: null, name: null}
    const urlToFileWithNewExeName = urlJoin(
      STATIC_ASSETS_BASE_URL,
      processPlatformToS3FolderMap[process.platform]
      , 'exe-name-' + STATIC_ASSETS_BRANCH
    )
    console.log(`[ServerManager] urlToFileWithNewExeName: ${urlToFileWithNewExeName}`)
    rp(urlToFileWithNewExeName).then(exeName => {
      downloadInfo.name = path.basename(exeName.trim())
      const exeNameURIEncoded = encodeURIComponent(downloadInfo.name)
      const opentronsExeUrl = urlJoin(
        STATIC_ASSETS_BASE_URL,
        processPlatformToS3FolderMap[process.platform],
        exeNameURIEncoded
      )
      downloadInfo.url = opentronsExeUrl

      console.log('[ServerManager] New server exe info', downloadInfo)
      resolve(downloadInfo)
    }).catch((err) => {
      console.log(`[ServerManager] Could not find latest exe to download from: ${urlToFileWithNewExeName}`)
    })
  })
}

function downloadNewBackendServer() {
  console.log('[ServerManager] Initiating new server download')
  let migrateExeFunc = (file, newFile) => () => {
    fs.chmodSync(file, '755')
    fs.renameSync(file, newFile)
  }
  let parseExeName = (filePath) => {
    return path.basename(filePath)
      .replace('.new', '')
      .replace('.latest', '')
  }
  getDownloadInfoForNewBackendServer().then((downloadInfo) => {
    const userDataPath = app.getPath('userData')
    const tmpDownloadDest = path.join(os.tmpdir(), downloadInfo.name + '.latest')
    const finalDownloadDest = path.join(userDataPath, 'server-executables', downloadInfo.name + '.new')
    const currentExePath = getLatestExecutablePath() || getBuiltinExecutablePath()
    if (parseExeName(finalDownloadDest) === parseExeName(currentExePath)) {
      console.log('[ServerManager] Skipping exe download because current exe is the lastest')
      return
    } else {
      console.log(`[ServerManager] Initiating new exe download because current exe is not the latest: ${tmpDownloadDest}`)
      downloadFileFromWeb(
        downloadInfo.url,
        tmpDownloadDest,
        migrateExeFunc(tmpDownloadDest, finalDownloadDest),
        console.log
      )
    }
  }).catch((err) => {
    console.log('[ServerManager] Error encountered getting download info for new exe')
    console.trace(`[ServerManager] ${err}`)
  })
}

class ServerManager {
  constructor () {
    this.serverProcess = null
    this.processName = null
  }

  start () {
    const userDataPath = app.getPath('userData')
    let exePath = getLatestExecutablePath() || getBuiltinExecutablePath()
    let exeVersion = getExeVersion(exePath)
    console.log('Exe version:', exeVersion)
    console.log('exePath:', exePath)
    process.env['appVersion'] = exeVersion
    this.execFile(exePath, [userDataPath])
  }

  /**
  * Starts an executable in a separate process
  * @param {param} filePath - path to an executable
  * @param {Array} extraArgs - Array of arguments to pass during invocation of file
  */
  execFile (filePath, extraArgs) {
    this.serverProcess = childProcess.execFile(
      filePath,
      extraArgs,
      { stdio: 'ignore' },
      function (error, stdout, stderr) {
        console.log(stdout)
        console.log(stderr)
        if (error) {
          throw error
        }
      })

    this.processName = path.basename(this.serverProcess.spawnfile)
    console.log(
        'Backend process successfully started with PID', this.serverProcess.pid,
        'and using spawnfile', this.processName
      )
  }

  shutdown () {
    if (process.platform === 'darwin') {
      childProcess.spawnSync('pkill', ['-9', this.processName])
    } else if (process.platform === 'win32') {
      childProcess.spawnSync('taskkill', ['/t', '/f', '/im', this.processName])
    }
    console.log('backend process successfully shutdown')
  }
}

module.exports = {
  downloadNewBackendServer,
  promoteNewlyDownloadedExeToLatest,
  ServerManager
}
