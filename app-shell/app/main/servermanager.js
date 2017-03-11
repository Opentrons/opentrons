const childProcess = require('child_process')
const electron = require('electron')
const fs = require('fs');
const http = require('http');
const path = require('path')

const {app} = electron

const glob = require('glob')

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
  const newExePath = getNewlyDownloadedExecutablePath()

  // if we dont have a new exe exit
  if (newExePath === null) {
    return
  }

  const latestExePath = newExePath.replace('new', 'latest')
  try {
    fs.renameSync(newExePath, latestExePath)
  } catch (e) {
    console.log(`Error renaming exe from ${newExePath} to ${latestExePath}`)
  }
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
  promoteNewlyDownloadedExeToLatest,
  ServerManager
}
