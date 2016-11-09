const child_process = require('child_process')
const fs = require('fs')
const http = require('http')
const path = require('path')

const electron = require('electron')
const {app, BrowserWindow} = electron

const {addMenu} = require('./menu.js')
const {getLogger} = require('./logging.js')
const {initAutoUpdater} = require('./updater.js')
const {ServerManager} = require('./servermanager.js')


let serverManager = new ServerManager()
let mainWindow

if (process.env.NODE_ENV == 'development'){
  require('electron-debug')({showDevTools: 'undocked'});
}

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 900})
  mainWindow.loadURL("http://127.0.0.1:31950")
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
  // Prepare app data dir (necessary for logging errors that occur during setup)
  createAndSetAppDataDir()

  const mainLogger = getLogger('electron-main')
  process.on('uncaughtException', (error) => {
    if (process.listeners("uncaughtException").length > 1) {
      console.log(error)
      mainLogger.info(error)
    }
  })
  if (process.env.NODE_ENV == 'development') {
    require('vue-devtools').install()
  }

  // Startup Actions
  serverManager.start();
  setTimeout(createWindow, 2000)
  addMenu()
  initAutoUpdater()
}

app.on('ready', startUp)

app.on('quit', function(){
  serverManager.shutdown();
});
