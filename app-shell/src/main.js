// electron main entry point
import { app, ipcMain } from 'electron'
import contextMenu from 'electron-context-menu'

import { registerBuildrootUpdate } from './buildroot'
import { getConfig, getOverrides, getStore, registerConfig } from './config'
import { registerDiscovery } from './discovery'
import { registerLabware } from './labware'
import { createLogger } from './log'
import { initializeMenu } from './menu'
import { registerRobotLogs } from './robot-logs'
import { registerSystemInfo } from './system-info'
import { createUi } from './ui'
import { registerUpdate } from './update'

const config = getConfig()
const log = createLogger('main')

log.debug('App config', {
  config,
  store: getStore(),
  overrides: getOverrides(),
})

if (config.devtools) {
  require('electron-debug')({ isEnabled: true, showDevTools: true })
}

// hold on to references so they don't get garbage collected
let mainWindow
let rendererLogger

// prepended listener is important here to work around Electron issue
// https://github.com/electron/electron/issues/19468#issuecomment-623529556
app.prependOnceListener('ready', startUp)
if (config.devtools) app.once('ready', installDevtools)

app.once('window-all-closed', () => {
  log.debug('all windows closed, quitting the app')
  app.quit()
})

function startUp() {
  log.info('Starting App')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))
  process.on('unhandledRejection', reason =>
    log.error('Uncaught Promise rejection: ', { reason })
  )

  mainWindow = createUi()
  rendererLogger = createRendererLogger()

  mainWindow.once('closed', () => (mainWindow = null))

  contextMenu({ showInspectElement: config.devtools })
  initializeMenu()

  // wire modules to UI dispatches
  const dispatch = action => {
    if (mainWindow) {
      log.silly('Sending action via IPC to renderer', { action })
      mainWindow.webContents.send('dispatch', action)
    }
  }

  const actionHandlers = [
    registerConfig(dispatch),
    registerDiscovery(dispatch),
    registerRobotLogs(dispatch, mainWindow),
    registerUpdate(dispatch),
    registerBuildrootUpdate(dispatch),
    registerLabware(dispatch, mainWindow),
    registerSystemInfo(dispatch),
  ]

  ipcMain.on('dispatch', (_, action) => {
    log.debug('Received action via IPC from renderer', { action })
    actionHandlers.forEach(handler => handler(action))
  })

  log.silly('Global references', { mainWindow, rendererLogger })
}

function createRendererLogger() {
  log.info('Creating renderer logger')

  const logger = createLogger('renderer')
  ipcMain.on('log', (_, info) => logger.log(info))

  return logger
}

function installDevtools() {
  const devtools = require('electron-devtools-installer')
  const extensions = [devtools.REACT_DEVELOPER_TOOLS, devtools.REDUX_DEVTOOLS]
  const install = devtools.default
  const forceReinstall = config.reinstallDevtools

  log.debug('Installing devtools')

  return install(extensions, forceReinstall)
    .then(() => log.debug('Devtools extensions installed'))
    .catch(error => {
      log.warn('Failed to install devtools extensions', {
        forceReinstall,
        error,
      })
    })
}
