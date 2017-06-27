import 'babel-polyfill'
import {app, BrowserWindow} from 'electron'
import fs from 'fs'
import path from 'path'
import request from 'request-promise'
import {addMenu} from './menu'
import {getLogger} from './logging'
import {initAutoUpdater} from './updater'
import {ServerManager} from './servermanager'

if (require('electron-squirrel-startup')) app.quit()
const mainLogger = getLogger('electron-main')

const port = process.env.PORT || 8090
const dataDirName = 'otone_data'
let appWindowUrl = `http://127.0.0.1:31950/`
if (process.env.NODE_ENV === 'development') {
  require('electron-debug')({showDevTools: 'undocked'})
  appWindowUrl = `http://127.0.0.1:${port}/`
}

const delay = time => new Promise(resolve => setTimeout(resolve, time))

process.env.APP_DATA_DIR = (() => {
  const dir = path.join(app.getPath('userData'), dataDirName)
  !fs.existsSync(dir) && fs.mkdirSync(dir)
  return dir
})()

let createWindow = async (windowUrl) => {
  const mainWindow = new BrowserWindow({width: 1060, height: 750})
  mainLogger.info('Creating Electron App window at ' + windowUrl)

  mainWindow.on('closed', function () {
    mainLogger.info('Electron App window closed, quitting App')
    request(windowUrl + 'exit')
      .then(() => {
        app.quit()
      })
      .catch((err) => {
        mainLogger.error('Received an expected error while calling exit route', err)
        app.quit()
      })
  })

  mainWindow.on('unresponsive', async () => {
    mainLogger.info('window is unresponsive, reloading')
    await delay(500)
    mainWindow.reload()
  })

  // Note: Auth0 pop window does not close itself, 
  // this will close this window when it pops up
  setInterval(() => {
    BrowserWindow.getAllWindows()
      .filter(win => win.frameName === 'auth0_signup_popup')
      .map(win => win.close())
  }, 3000)

  await delay(200)

  addMenu()
  initAutoUpdater()

  mainWindow.webContents.loadURL(
    windowUrl,
    {'extraHeaders': 'pragma: no-cache\n'}
  )

  return mainWindow
}

let startUp = async () => {
  // Prepare app data dir (necessary for logging errors that occur during setup)
  mainLogger.info('Starting App')

  // NOTE: vue-devtools can only be installed after app the 'ready' event
  if (process.env.NODE_ENV === 'development') {
    require('vue-devtools').install()
  }

  process.on('uncaughtException', error => {
    if (process.listeners('uncaughtException')) {
      mainLogger.info('Uncaught Exception: ', error)
    }
  })

  const serverManager = new ServerManager()
  serverManager.start()
  app.on('quit', () => {
    serverManager.shutdown()
  })

  while (!await request(appWindowUrl, {timeout: 1000})) {
    await delay(1000)
  }

  createWindow(appWindowUrl)
}

app.on('ready', startUp)
