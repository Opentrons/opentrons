const childProcess = require('child_process')
const electron = require('electron')
const path = require('path')

const {app} = electron

class ServerManager {
  constructor () {
    this.serverProcess = null
    this.processName = null
  }

  start() {
    process.env['appVersion'] = app.getVersion()

    if (process.env.NODE_ENV === 'development') {
      console.log('Not starting embedded API server since we are in development mode')
      return
    }

    const userDataPath = app.getPath('userData')
    console.log('User Data Path', userDataPath)

    const serverExt = process.platform === 'win32' ? '.exe' : ''
    const backendPath = path.join(app.getAppPath(), 'bin', `opentrons-api-server${serverExt}`)

    // App UI assets are marked to be unpacked in electron-builder config
    const uiPath = path.join(app.getAppPath(), 'ui').replace('app.asar', 'app.asar.unpacked')
    console.log('Serving UI from: ', uiPath)

    this.execFile(backendPath, [uiPath])
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
