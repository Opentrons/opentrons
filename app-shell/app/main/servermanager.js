const childProcess = require('child_process')
const electron = require('electron')
const path = require('path')

const {app} = electron

class ServerManager {
  constructor () {
    this.serverProcess = null
    this.processName = null
  }

  /*
   * Returns map of latest backends
   */
  getBackendsMap () {
    // TODO: return path of existing backend
  }

  /*
   * Returns map of backends zipped into electron app
   */
  getBuiltinBackendsMap () {
    const userDataPath = app.getPath('userData')
    console.log('User Data Path', userDataPath)
    return {
      'darwin': '/backend-dist/mac/otone_server',
      'linux': '/backend-dist/linux/otone_server',
      'win32': '\\backend-dist\\win\\otone_server.exe'
    }
  }

  start () {
    let backendPath
    if (!(process.platform in backends)) {
      console.log('\n\n\n\nunknown OS: ' + process.platform + '\n\n\n\n')
      return
    }

    // TODO: abstract this into a function
    backendPath = app.getAppPath() + backends[process.platform]

    process.env['appVersion'] = app.getVersion()
    this.execFile(backendPath, [userDataPath])
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
