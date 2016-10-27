const child_process = require('child_process')
const electron = require('electron')
const path = require('path')

const {app} = electron


class ServerManager {
  constructor() {
    this.serverProcess = null;
    this.processName = null;
  }

  start () {
    const userDataPath = app.getPath('userData');
    console.log('User Data Path', userDataPath)
    let backend_path
    if (process.platform == "darwin") {
      backend_path = app.getAppPath() + "/backend-dist/mac/otone_server";
      this.execFile(backend_path, [userDataPath]);
    } else if (process.platform == "win32") {
      backend_path = app.getAppPath() + "\\backend-dist\\win\\otone_server.exe";
      this.execFile(backend_path, [userDataPath]);
    } else{
      console.log('\n\n\n\nunknown OS: '+process.platform+'\n\n\n\n');
    }
  }

  /**
  * Starts an executable in a separate process
  * @param {param} filePath - path to an executable
  * @param {Array} extraArgs - Array of arguments to pass during invocation of file
  */
  execFile (filePath, extraArgs) {
    this.serverProcess = child_process.execFile(
      filePath,
      extraArgs,
      {stdio: 'ignore' },
      function(error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error) {
          throw error;
        }
      });

      this.processName = path.basename(this.serverProcess.spawnfile)
      console.log(
        'Backend process successfully started with PID', this.serverProcess.pid,
        'and using spawnfile', this.processName
      );
  }
  shutdown() {
    if (process.platform == "darwin") {
      child_process.spawnSync('pkill', ['-9', this.processName]);
    }
    else if (process.platform == "win32") {
      child_process.spawnSync('taskkill', ['/t', '/f',  '/im', this.processName]);
    }
    console.log('backend process successfully shutdown')
  }
}


module.exports = {
  ServerManager
}
