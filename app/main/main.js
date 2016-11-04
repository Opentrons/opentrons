const child_process = require('child_process')
const fs = require('fs')
const http = require('http')
const path = require('path')

const electron = require('electron')

const {app, BrowserWindow} = electron
const {ServerManager} = require('./servermanager.js')
const {getLogger} = require('./logging.js')
const {initAutoUpdater} = require('./updater.js')


let serverManager = new ServerManager()
let mainWindow


if (process.env.NODE_ENV == 'development'){
  require('electron-debug')({showDevTools: 'undocked'});
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

function createAndSetAppDataDir() {
  if (!app.isReady()) {
    throw Error("Attempting to create otone_data dir when app is not ready")
  }
  const appDataDir = path.join(app.getPath('userData'), 'otone_data')

  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir)
  }
  process.env['APP_DATA_DIR'] = appDataDir
}

function startUp() {
  createAndSetAppDataDir()
  serverManager.start();
  setTimeout(createWindow, 2000)
  initAutoUpdater()

  const mainLogger = getLogger('electron-main')
  process.on('uncaughtException', (error) => {
    if (process.listeners("uncaughtException").length > 1) {
      mainLogger.info(error)
    }
  })
  if (process.env.NODE_ENV == 'development') {
    require('vue-devtools').install()
  }
}

app.on('ready', startUp)

app.on('quit', function(){
  serverManager.shutdown();
});
