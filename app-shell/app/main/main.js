if (require('electron-squirrel-startup')) return
const child_process = require('child_process')
const fs = require('fs')
const http = require('http')
const path = require('path')
const urlJoin = require('url-join')

const electron = require('electron')
const rp = require('request-promise')
const {app, BrowserWindow, ipcMain} = electron

const {addMenu} = require('./menu.js')
const {getLogger} = require('./logging.js')
const {initAutoUpdater} = require('./updater.js')
const {ServerManager} = require('./servermanager.js')
const {PythonEnvManager} = require('./envmanager.js')
const {waitUntilServerResponds} = require('./util.js')

const deskmetrics = require('deskmetrics')

let serverManager = new ServerManager()
let mainWindow
let appWindowUrl = 'http://localhost:31950/'

if (process.env.NODE_ENV === 'development'){
  require('electron-debug')({showDevTools: 'undocked'});
  appWindowUrl = 'http://localhost:8090/'
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

  deskmetrics.start({ appId: '8d9af03aa1', version:  app.getVersion()}).then(function() {
    // Set properties
    console.log('App version is', app.getVersion());
    deskmetrics.setProperty('version', app.getVersion())
    deskmetrics.setProperty('build', app.getVersion())
  })
  ipcMain.on('analytics', (event, appEvent, appEventMetadata) => {
    // console.log('Sending event', appEvent, appEventMetadata)
    deskmetrics.send(appEvent, appEventMetadata)
  })

  process.on('uncaughtException', (error) => {
    if (process.listeners('uncaughtException').length > 1) {
      console.log(error)
      mainLogger.info(error)
    }
  })

  serverManager.start()
  waitUntilServerResponds(
    //() => createWindow('http://localhost:8090/'),
    () => createWindow(appWindowUrl),
    'http://localhost:31950/'
  )
  addMenu()
  initAutoUpdater()
}

app.on('ready', startUp)
app.on('quit', function () {
  serverManager.shutdown()
})
