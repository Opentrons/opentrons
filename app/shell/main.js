import {app, BrowserWindow} from 'electron'
import fs from 'fs'
import path from 'path'
import request from 'request-promise'
import {addMenu} from './menu'
import {getLogger} from './logging'
import {initAutoUpdater} from './updater'
import {ServerManager} from './servermanager'
import url from 'url'
import shell from 'shelljs'

if (require('electron-squirrel-startup')) app.quit()

const port = process.env.PORT || 8090
const dataDirName = 'otone_data'
let appWindowUrl = `http://127.0.0.1:31950/`
// TODO: Test app behavior with UI loaded from file://
// const indexPath = path.join(__dirname, '../../ui/index.html')
// console.log(`Index path: ${indexPath}`)
// let appWindowUrl = `file://${indexPath}`

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')({showDevTools: 'undocked'})
  appWindowUrl = `http://127.0.0.1:${port}/`
}

// TODO(artyom): it should belong to integration test and/or CI scripts
// but for that we need to determine userData value before running the test
// and for that we need to create an instance of the app. 
// 
// Clean up User Data for tests
if (process.env.INTEGRATION_TEST === 'true') {
  const userData = app.getPath('userData')
  console.log(`We are in Integration Test mode. Deleting userData: ${userData}`)
  shell.rm('-rf', app.getPath('userData'))
}

const delay = time => new Promise(resolve => setTimeout(resolve, time))

process.env.APP_DATA_DIR = (() => {
  const dir = path.join(app.getPath('userData'), dataDirName)
  // 'userData' is created on app.on('ready'), since we need it earlier
  // for logging, we want to make sure it exis
  if (!fs.existsSync(dir)) shell.mkdir('-p', dir)
  return dir
})()

const log = getLogger('electron-main')

let loadUI = windowUrl => {
  const version = app.getVersion()
  const agent = BrowserWindow.getAllWindows()[0].webContents.getUserAgent().replace(/Chrome\/[\d+\.]+/, `Chrome/${version}`)
  log.info('Loading App UI at ' + windowUrl)
  BrowserWindow.getAllWindows()[0].loadURL(
    windowUrl,
    {'extraHeaders': 'pragma: no-cache\n', userAgent: agent}
  )
  log.info('Dispatched .loadURL call')
}

let createWindow = async () => {
  // Avoid window flashing and possibly fix integration tests
  // that are waiting for the window that appears before page is loaded
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#showing-window-gracefully
  const mainWindow = new BrowserWindow({show: false, width: 1060, height: 750})
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', function () {
    log.info('Electron App window closed, quitting App')
    request(url.resolve(appWindowUrl, 'exit'))
      .then(() => {
        app.quit()
      })
      .catch((err) => {
        log.error('Received an expected error while calling exit route', err)
        app.quit()
      })
  })

  mainWindow.on('unresponsive', async () => {
    log.info('window is unresponsive, reloading')
    await delay(500)
    mainWindow.reload()
  })

  // TODO: the sequence of instantiating the BrowserWindow
  // and then calling loadURL with our UI causes integration 
  // tests to fail randomly on windows, likely due to a race
  // condition while WebDriver is connecting to Chrome DevTools
  // causing Chrome to crash. We are experimenting with pre-loading
  // 'about:blank' first
  // mainWindow.loadURL('about:blank')

  // Note: Auth0 pop window does not close itself, 
  // this will close this window when it pops up
  setInterval(() => {
    BrowserWindow.getAllWindows()
      .filter(win => win.frameName === 'auth0_signup_popup')
      .map(win => win.close())
  }, 3000)

  addMenu()
  initAutoUpdater()

  return mainWindow
}

let startUp = async () => {
  log.info('Starting App')

  // NOTE: vue-devtools can only be installed after app the 'ready' event
  if (process.env.NODE_ENV === 'development') {
    require('vue-devtools').install()
  }

  process.on('uncaughtException', error => {
    if (process.listeners('uncaughtException')) {
      log.info('Uncaught Exception: ', error)
    }
  })

  const serverManager = new ServerManager()
  serverManager.start()
  app.on('quit', () => {
    serverManager.shutdown()
  })

  createWindow()

  let response
  do {
    response = await request(
      appWindowUrl,
      {timeout: 1000}
    ).catch(error => {
      log.debug(`While pinging back-end process: ${error}`)
    })
    await delay(1000)
  } while (!response)

  loadUI(appWindowUrl)
}

app.on('ready', startUp)
