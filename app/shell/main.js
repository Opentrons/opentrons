import {app, Menu, BrowserWindow} from 'electron'
import fs from 'fs'
import path from 'path'
import {addMenu} from './menu'
import {getLogger} from './logging'
import {initAutoUpdater} from './updater'
import {ServerManager} from './servermanager'
import url from 'url'
import shell from 'shelljs'

if (require('electron-squirrel-startup')) app.quit()

const dataDirName = 'otone_data'
const indexPath = path.join(__dirname, '..', 'ui', 'index.html')
const appWindowUrl = url.resolve('file://', indexPath)
console.log(appWindowUrl)

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};

// TODO(artyom): it should belong to integration test and/or CI scripts
// but for that we need to determine userData value before running the test
// and for that we need to create an instance of the app.
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

let loadUI = (win, url) => {
  log.info('Loading App UI at ' + url)
  win.loadURL(
    url,
    {'extraHeaders': 'pragma: no-cache\n'}
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

  mainWindow.on('unresponsive', async () => {
    log.info('window is unresponsive, reloading')
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

  addMenu()
  initAutoUpdater()

  return mainWindow
}

let startUp = async () => {
  log.info('Starting App')

  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
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

  const mainWindow = await createWindow()
  loadUI(mainWindow, appWindowUrl)

  // Setup Development Environment
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    mainWindow.openDevTools();
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => {
            mainWindow.inspectElement(x, y);
          }
        }])
        .popup(mainWindow);
    });
  }
}

app.on('ready', startUp)
