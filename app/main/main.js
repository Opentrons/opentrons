const http = require('http')
const child_process = require('child_process')
const electron = require('electron')
const {app, BrowserWindow} = electron
const {ServerManager} = require('./servermanager.js')
const {getLogger} = require('./logging.js')
const {initAutoUpdater} = require('./updater.js')


let serverManager = new ServerManager()
let mainWindow


if (process.env.NODE_ENV == 'development'){
  require('electron-debug')({showDevTools: true});
}

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 900})
  // TODO: use FLASK port when not in development
  mainWindow.loadURL("http://127.0.0.1:5000")

  mainWindow.on('closed', function () {
    mainWindow = null
    app.quit()
  })
}

function startUp() {
  const mainLogger = getLogger('electron-main')

  serverManager.start();
  setTimeout(createWindow, 2000)
  initAutoUpdater()
  process.on('uncaughtException', (error) => {
    if (process.listeners("uncaughtException").length > 1) {
      mainLogger.info(error)
    }
  })
}

app.on('ready', startUp)

app.on('quit', function(){
  serverManager.shutdown();
});
