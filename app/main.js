const http = require('http')
const child_process = require('child_process')
const electron = require('electron')
const {app, BrowserWindow} = electron

let mainWindow

function startFlaskServer() {
  child_process.exec("source frontend_env/bin/activate && python3 main.py", function(error, stdout, stderr){
        console.log(stdout);
        console.log(stderr);
        if (error) {
            throw error;
        }
    });
  setTimeout(createWindow, 5000)
}

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 900})
  mainWindow.loadURL("http://127.0.0.1:5000/welcome/connect")

  mainWindow.on('closed', function () {
    mainWindow = null
    app.quit();
  })
}

app.on('ready', startFlaskServer)
app.on('ready', createWindow)
