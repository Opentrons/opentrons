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
const {promoteNewlyDownloadedExeToLatest, ServerManager} = require('./servermanager.js')
const {PythonEnvManager} = require('./envmanager.js')
const {waitUntilServerResponds} = require('./util.js')

let serverManager = new ServerManager()
let mainWindow
let pyRunProcess

const STATIC_ASSETS_BASE_URL = process.env.STATIC_ASSETS_BASE_URL || 'http://s3.amazonaws.com/ot-app-builds/assets/'
const STATIC_ASSETS_BRANCH = process.env.STATIC_ASSETS_BRANCH || 'stable'
const STATIC_ASSETS_URL = urlJoin(STATIC_ASSETS_BASE_URL, STATIC_ASSETS_BRANCH)

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

function downloadNewBackendServer () {
  /**
   * 1) Get exe name from from file
   * 2) With exe name; download actual exe
   * 3) Save downloaded exe with extension "*.new"
   */
  const urlToFileWithNewExeName = urlJoin(STATIC_ASSETS_URL, 'exe-name')
  rp(urlToFileWithNewExeName).then(exeName => {
    const exeNameURIEncoded = encodeURIComponent(exeName.trim())
    const opentronsExeUrl = urlJoin(STATIC_ASSETS_URL, exeNameURIEncoded)
    console.log('Detected new server exe:', opentronsExeUrl)
  }).catch((err) => {
    console.log('Could not find latest exe to download', err)
  })
}

function startUp () {
  // Prepare app data dir (necessary for logging errors that occur during setup)
  createAndSetAppDataDir()
  const mainLogger = getLogger('electron-main')

  mainLogger.info(`STATIC_ASSETS_BASE_URL: ${STATIC_ASSETS_BASE_URL}`)
  mainLogger.info(`STATIC_ASSETS_BRANCH: ${STATIC_ASSETS_BRANCH}`)
  mainLogger.info(`STATIC_ASSETS_URL: ${STATIC_ASSETS_URL}`)

  if (process.env.NODE_ENV === 'development') {
    require('vue-devtools').install()
  }

  downloadNewBackendServer()
  promoteNewlyDownloadedExeToLatest()
  serverManager.start()
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
