// electron main entry point
import { app, ipcMain } from 'electron'
import { createUi } from './ui'
import { createLogger } from './log'
import { registerDiscovery } from './discovery'
import { registerRobotLogs } from './robot-logs'
import {
  registerUpdate,
  updateLatestVersion,
  registerUpdateBrightness,
} from './update'
import { registerRobotSystemUpdate } from './system-update'
import { registerAppRestart } from './restart'
import { getConfig, getStore, getOverrides, registerConfig } from './config'
import systemd from './systemd'

import type { BrowserWindow } from 'electron'
import type { Dispatch, Logger } from './types'

systemd.sendStatus('starting app')
const config = getConfig()
const log = createLogger('main')

log.debug('App config', {
  config,
  store: getStore(),
  overrides: getOverrides(),
})

systemd.setRemoteDevToolsEnabled(config.devtools)

// hold on to references so they don't get garbage collected
let mainWindow: BrowserWindow | null | undefined
let rendererLogger: Logger

// prepended listener is important here to work around Electron issue
// https://github.com/electron/electron/issues/19468#issuecomment-623529556
app.prependOnceListener('ready', startUp)
if (config.devtools) app.once('ready', installDevtools)

app.once('window-all-closed', () => {
  log.debug('all windows closed, quitting the app')
  app.quit()
})

function startUp(): void {
  log.info('Starting App')
  systemd.sendStatus('loading app')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))
  process.on('unhandledRejection', reason =>
    log.error('Uncaught Promise rejection: ', { reason })
  )

  // wire modules to UI dispatches
  const dispatch: Dispatch = action => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (mainWindow) {
      log.silly('Sending action via IPC to renderer', { action })
      mainWindow.webContents.send('dispatch', action)
    }
  }

  mainWindow = createUi(dispatch)
  rendererLogger = createRendererLogger()

  mainWindow.once('closed', () => (mainWindow = null))

  log.info('Fetching latest software version')
  updateLatestVersion().catch((error: Error) => {
    log.error('Error fetching latest software version: ', { error })
  })

  const actionHandlers: Dispatch[] = [
    registerConfig(dispatch),
    registerDiscovery(dispatch),
    registerRobotLogs(dispatch, mainWindow),
    registerUpdate(dispatch),
    registerRobotSystemUpdate(dispatch),
    registerAppRestart(),
    registerUpdateBrightness(),
  ]

  ipcMain.on('dispatch', (_, action) => {
    log.debug('Received action via IPC from renderer', { action })
    actionHandlers.forEach(handler => handler(action))
  })

  log.silly('Global references', { mainWindow, rendererLogger })

  ipcMain.once('dispatch', () => {
    systemd.sendStatus('started')
    systemd.ready()
  })
}

function createRendererLogger(): Logger {
  log.info('Creating renderer logger')

  const logger = createLogger('renderer')
  ipcMain.on('log', (_, info) => logger.log(info))

  return logger
}

function installDevtools(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const devtools = require('electron-devtools-installer')
  const extensions = [devtools.REACT_DEVELOPER_TOOLS, devtools.REDUX_DEVTOOLS]
  const install = devtools.default
  const forceReinstall = config.reinstallDevtools

  log.debug('Installing devtools')

  install(extensions, forceReinstall)
    .then(() => log.debug('Devtools extensions installed'))
    .catch((error: unknown) => {
      log.warn('Failed to install devtools extensions', {
        forceReinstall,
        error,
      })
    })
}
