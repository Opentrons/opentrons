if (require('electron-squirrel-startup')) return
const child_process = require('child_process')
const fs = require('fs')
const http = require('http')
const path = require('path')

const electron = require('electron')
const rp = require('request-promise')
const {app, BrowserWindow, ipcMain} = electron

const {addMenu} = require('./menu.js')
const {getLogger} = require('./logging.js')
const {initAutoUpdater} = require('./updater.js')
const {downloadNewBackendServer, promoteNewlyDownloadedExeToLatest, ServerManager} = require('./servermanager.js')
const {PythonEnvManager} = require('./envmanager.js')
const {waitUntilServerResponds} = require('./util.js')

let serverManager = new ServerManager()
let mainWindow
let pyRunProcess

if (process.env.NODE_ENV === 'development'){
  require('electron-debug')({showDevTools: 'undocked'});
}

function createWindow (windowUrl) {
  mainWindow = new BrowserWindow({width: 1060, height: 750})
  mainWindow.loadURL(windowUrl)
  mainWindow.on('closed', function () {
    mainWindow = null
    app.quit()
  })
  return mainWindow
}

function createAndSetAppDataDir () {
  if (!app.isReady()) {
    throw Error('Attempting to create otone_data dir when app is not ready')
  }
  const appDataDir = path.join(app.getPath('userData'), 'otone_data')

  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir)
  }
  process.env['APP_DATA_DIR'] = appDataDir
}


function startUp () {
  // Prepare app data dir (necessary for logging errors that occur during setup)
  createAndSetAppDataDir()
  const mainLogger = getLogger('electron-main')

  // mainLogger.info(`STATIC_ASSETS_BASE_URL: ${STATIC_ASSETS_BASE_URL}`)
  // mainLogger.info(`STATIC_ASSETS_BRANCH: ${STATIC_ASSETS_BRANCH}`)

  if (process.env.NODE_ENV === 'development') {
    require('vue-devtools').install()
  }

  downloadNewBackendServer()  // rename to async
  promoteNewlyDownloadedExeToLatest().then(() => serverManager.start())
  // serverManager.start()
  waitUntilServerResponds(
    () => createWindow('http://localhost:31950/'),
    'http://localhost:31950/'
  )
  addMenu()
  initAutoUpdater()
}

app.on('ready', startUp)
app.on('quit', function () {
  rp('http://localhost:31950/exit')
})
