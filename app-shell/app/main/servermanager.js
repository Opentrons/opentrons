const childProcess = require('child_process')
const electron = require('electron')
const path = require('path')

const {app} = electron

const glob = require('glob')

class ServerManager {
  constructor () {
    this.serverProcess = null
    this.processName = null
  }

  /*
   * Returns map of latest backends
   */
  getLatestExecutable () {
    const userDataPath = app.getPath('userData')
    let serverExecutablesPath = path.join(userDataPath, 'server-executables')
    return glob.sync(path.join(serverExecutablesPath, '*.latest'))[0] || null
  }

  /*
   * Returns path to backend built with electron app
   */
  getBuiltinExecutable () {
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

  start () {
    const userDataPath = app.getPath('userData')
    let exePath = this.getLatestExecutable() || this.getBuiltinExecutable()
    process.env['appVersion'] = app.getVersion()
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
  ServerManager
}
