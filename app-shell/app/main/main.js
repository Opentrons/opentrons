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
const {getLatestExecutablePath, promoteNewlyDownloadedExeToLatest, ServerManager} = require('./servermanager.js')
const {PythonEnvManager} = require('./envmanager.js')
const {download, waitUntilServerResponds} = require('./util.js')

let serverManager = new ServerManager()
let mainWindow
let pyRunProcess

const STATIC_ASSETS_BASE_URL = process.env.STATIC_ASSETS_BASE_URL || 'http://s3.amazonaws.com/ot-app-builds/server-exes/'
const STATIC_ASSETS_BRANCH = process.env.STATIC_ASSETS_BRANCH || 'stable'
// const STATIC_ASSETS_URL = urlJoin(STATIC_ASSETS_BASE_URL, STATIC_ASSETS_BRANCH)

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

function getDownloadInfoForNewBackendServer () {
  /**
   * 1) Get exe name from from file
   * 2) With exe name; download actual exe
   * 3) Save downloaded exe with extension "*.new"
   */

  var processPlatformToS3FolderMap = {
    'darwin': 'mac',
    'win32': 'win',
    'linux': 'linux'
  }

  return new Promise((resolve, reject) => {
    let downloadInfo = {url: null, name: null}
    const urlToFileWithNewExeName = urlJoin(STATIC_ASSETS_BASE_URL, 'exe-name-' + STATIC_ASSETS_BRANCH)
    rp(urlToFileWithNewExeName).then(exeName => {
      downloadInfo.name = path.basename(exeName.trim())
      const exeNameURIEncoded = encodeURIComponent(downloadInfo.name)
      const opentronsExeUrl = urlJoin(
        STATIC_ASSETS_BASE_URL,
        processPlatformToS3FolderMap[process.platform],
        exeNameURIEncoded
      )
      downloadInfo.url = opentronsExeUrl
      console.log('New server exe info:', downloadInfo)
      resolve(downloadInfo)
    }).catch((err) => {
      console.log('Could not find latest exe to download from', urlToFileWithNewExeName)
    })
  })
}

function downloadNewBackendServer() {
  let promoteExeFromLoadingToNew = (file) => () => {
    let newFile = file.replace('loading', 'new')
    fs.chmodSync(file, '755')
    fs.renameSync(file, newFile)
  }
  getDownloadInfoForNewBackendServer().then((downloadInfo) => {
    const userDataPath = app.getPath('userData')
    const exeFolder = path.join(userDataPath, 'server-executables')
    const downloadDest = path.join(exeFolder, downloadInfo.name + '.loading')
    let latestExePath = getLatestExecutablePath().replace('.latest', '.loading')
    if (downloadDest === latestExePath) {
      console.log('SKIPPING EXE DOWNLOAD')
      return
    }
    console.log('Downloading exe to', downloadDest)
    download(downloadInfo.url, downloadDest, promoteExeFromLoadingToNew(downloadDest), console.log)
  })
}

function startUp () {
  // Prepare app data dir (necessary for logging errors that occur during setup)
  createAndSetAppDataDir()
  const mainLogger = getLogger('electron-main')

  mainLogger.info(`STATIC_ASSETS_BASE_URL: ${STATIC_ASSETS_BASE_URL}`)
  mainLogger.info(`STATIC_ASSETS_BRANCH: ${STATIC_ASSETS_BRANCH}`)
  // mainLogger.info(`STATIC_ASSETS_URL: ${STATIC_ASSETS_URL}`)

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
