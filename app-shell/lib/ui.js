// sets up the main window ui
'use strict'

const {BrowserWindow} = require('electron')
const {DEV_MODE, DEBUG_MODE, ui: config} = require('./config')
const log = require('./log')(__filename)

const WINDOW_OPTS = {
  show: false,
  useContentSize: true,
  width: config.width,
  height: config.height,
  webPreferences: {
    // TODO(mc, 2018-05-15): turn off experimentalFeatures?
    experimentalFeatures: true,
    devTools: DEV_MODE || DEBUG_MODE,

    // TODO(mc, 2018-05-15): disable nodeIntegration in renderer thread
    nodeIntegration: true,
    // node integration needed for mdns robot discovery in webworker
    nodeIntegrationInWorker: true,

    // TODO(mc, 2018-02-12): this works around CORS restrictions
    //   while in dev mode; evaluate whether this is acceptable
    webSecurity: !DEV_MODE
  }
}

module.exports = function createUi () {
  log.debug('Creating main window', {options: WINDOW_OPTS})

  const mainWindow = new BrowserWindow(WINDOW_OPTS)
    .once('ready-to-show', () => {
      log.debug('Main window ready to show')
      mainWindow.show()
    })

  log.info(`Loading ${config.url}`)
  mainWindow.loadURL(config.url, {'extraHeaders': 'pragma: no-cache\n'})

  return mainWindow
}
