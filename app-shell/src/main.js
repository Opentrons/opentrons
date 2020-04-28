// electron main entry point
import { app, ipcMain } from 'electron'
import contextMenu from 'electron-context-menu'

import { createUi } from './ui'
import { initializeMenu } from './menu'
import { createLogger } from './log'
import { getConfig, getStore, getOverrides, registerConfig } from './config'
import { registerDiscovery } from './discovery'
import { registerLabware } from './labware'
import { registerRobotLogs } from './robot-logs'
import { registerUpdate } from './update'
import { registerBuildrootUpdate } from './buildroot'
import { registerSystemInfo } from './system-info'

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

app.once('ready', startUp)
app.once('window-all-closed', () => app.quit())

function startUp() {
  log.info('Starting App')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))

  mainWindow = createUi()
  rendererLogger = createRendererLogger()

  mainWindow.once('closed', () => (mainWindow = null))

  if (config.devtools) installDevtools()
  contextMenu({ showInspectElement: config.devtools })
  initializeMenu()

  // wire modules to UI dispatches
  const dispatch = action => {
    log.silly('Sending action via IPC to renderer', { action })
    mainWindow.webContents.send('dispatch', action)
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
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']
  const install = devtools.default
  const forceReinstall = config.reinstallDevtools

  return Promise.all(
    extensions.map(name => {
      return install(devtools[name], forceReinstall)
        .then(() => log.debug('Devtools extension installed', { name }))
        .catch(e =>
          log.warn('Failed to install devtools extension', {
            name,
            forceReinstall,
          })
        )
    })
  )
}
