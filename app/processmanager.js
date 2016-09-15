const child_process = require('child_process')
const electron = require('electron')
const path = require('path')

const {app} = electron


/**
 * Starts an executable in a separate process
 * @param {param} filePath - path to an executable
 * @param {Array} extraArgs - Array of arguments to pass during invocation of file
 */
function execFile(filePath, extraArgs) {
    backendProcess = child_process.execFile(filePath, extraArgs, {stdio: 'ignore' }, function(error, stdout, stderr){
        console.log(stdout);
        console.log(stderr);
        if (error) {
            throw error;
        }
    });

    var backendProcessName = path.basename(backendProcess.spawnfile)
    console.log(
        'Backend process successfully started with PID', backendProcess.pid,
        'and using spawnfile', backendProcessName
    )

    backendProcess.shutdown = function (){
        if (process.platform == "darwin") {
            child_process.spawnSync('pkill', ['-9', backendProcessName]);
        }
        else if (process.platform == "win32") {
            child_process.spawnSync('taskkill', ['/T', '/F',  '/IM', backendProcessName]);
        }
        console.log('Backend process successfully shutdown')
    }
}

/**
 * Starts otone_client backend executable; kills existing process if any
 */
function startServer() {
    const userDataPath = app.getPath('userData');
    console.log('User Data Path', userDataPath)

    if (process.platform == "darwin") {
      var backend_path = app.getAppPath() + "/backend-dist/mac/otone_server";
      execFile(backend_path, [userDataPath]);
    }

    else if (process.platform == "win32") {
      var backend_path = app.getAppPath() + "\\backend-dist\\win\\otone_server.exe";
      execFile(backend_path, [userDataPath]);
    }
    else{
      console.log('\n\n\n\nunknown OS: '+process.platform+'\n\n\n\n');
    }
}

module.exports = {
  startServer
}
