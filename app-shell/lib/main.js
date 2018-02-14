// electron main entry point
'use strict'

const fs = require('fs')
const path = require('path')
const url = require('url')
const {app, dialog, Menu, BrowserWindow} = require('electron')
const log = require('electron-log')
const shell = require('shelljs')

const menu = require('./menu')
const initAutoUpdater = require('./updater')

if (require('electron-squirrel-startup')) app.quit()

// TODO(mc, 2018-01-06): replace dev and debug vars with feature vars
const DEV_MODE = process.env.NODE_ENV === 'development'
const DEBUG_MODE = process.env.DEBUG

const dataDirName = 'otone_data'

const appWindowUrl = DEV_MODE
  ? `http://localhost:${process.env.PORT}`
  : url.resolve('file://', path.join(__dirname, '../ui/index.html'))

if (DEV_MODE || DEBUG_MODE) {
  require('electron-debug')({showDevTools: true})
  const p = path.join(__dirname, '..', 'node_modules')
  require('module').globalPaths.push(p)
}

// TODO(artyom): it should belong to integration test and/or CI scripts
// but for that we need to determine userData value before running the test
// and for that we need to create an instance of the app.
// Clean up User Data for tests
if (process.env.INTEGRATION_TEST === 'true') {
  const userData = app.getPath('userData')
  console.log(`We are in Integration Test mode. Deleting userData: ${userData}`)
  shell.rm('-rf', app.getPath('userData'))
}

process.env.APP_DATA_DIR = (() => {
  const dir = path.join(app.getPath('userData'), dataDirName)
  // 'userData' is created on app.on('ready'), since we need it earlier
  // for logging, we want to make sure it exis
  if (!fs.existsSync(dir)) shell.mkdir('-p', dir)
  return dir
})()

app.on('ready', startUp)

function startUp () {
  log.info('Starting App')
  process.on('uncaughtException', (error) => log.info('Uncaught: ', error))

  const mainWindow = createWindow()

  loadUI(mainWindow, appWindowUrl)

  if (DEV_MODE || DEBUG_MODE) {
    installAndOpenExtensions(mainWindow)
      .catch((error) => dialog.showErrorBox('Error opening dev tools', error))
  }
}

function createWindow () {
  // Avoid window flashing and possibly fix integration tests
  // that are waiting for the window that appears before page is loaded
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
  const mainWindow = new BrowserWindow({
    show: false,
    useContentSize: true,
    width: 1024,
    height: 768,
    webPreferences: {
      devTools: DEV_MODE || DEBUG_MODE,
      experimentalFeatures: true,
      // node integration needed for mdns robot discovery
      nodeIntegrationInWorker: true,
      // TODO(mc, 2018-02-12): this works around CORS restrictions
      //   while in dev mode; evaluate whether this is acceptable
      webSecurity: !DEV_MODE
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('unresponsive', () => {
    log.info('window is unresponsive, reloading')
    setTimeout(() => mainWindow.reload(), 500)
  })

  // Note: Auth0 pop window does not close itself,
  // this will close this window when it pops up
  setTimeout(() => {
    BrowserWindow.getAllWindows()
      .filter(win => win.frameName === 'auth0_signup_popup')
      .map(win => win.close())
  }, 3000)

  menu()
  initAutoUpdater()

  return mainWindow
}

function loadUI (win, url) {
  log.info('Loading App UI at ' + url)
  win.loadURL(url, {'extraHeaders': 'pragma: no-cache\n'})
  log.info('App UI loaded')
}

function installAndOpenExtensions (mainWindow) {
  const devtools = require('electron-devtools-installer')
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS
  const install = devtools.default
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ]

  return Promise
    .all(extensions.map((name) => install(devtools[name], forceDownload)))
    .then(() => mainWindow.webContents.on('context-menu', (_, props) => {
      const {x, y} = props

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => mainWindow.inspectElement(x, y)
        }])
        .popup(mainWindow)
    }))
}
