// electron main entry point
import dns from 'dns'
import { app, ipcMain } from 'electron'
import contextMenu from 'electron-context-menu'
import electronDebug from 'electron-debug'
import * as electronDevtoolsInstaller from 'electron-devtools-installer'

import { getConfig, getOverrides, getStore, registerConfig } from './config'
import * as db from './db'
import { registerDiscovery } from './discovery'
import { registerLabware } from './labware'
import { createLogger } from './log'
import { initializeMenu } from './menu'
import { closeAllNotifyConnections, registerNotify } from './notifications'
import { registerProtocolAnalysis } from './protocol-analysis'
import { registerProtocolStorage } from './protocol-storage'
import { registerRobotUpdate } from './robot-update'
import { registerSystemInfo } from './system-info'
import { createUi, registerReloadUi, registerSystemLanguage } from './ui'
import { registerUpdate } from './update'
import { registerUsb } from './usb'

import type { BrowserWindow } from 'electron'
import type { LogEntry } from 'winston'
import type { Action, Dispatch, Logger } from './types'

dns.setDefaultResultOrder('ipv4first')
const config = getConfig()
const log = createLogger('main')

log.debug('App config', {
  config,
  store: getStore(),
  overrides: getOverrides(),
})

if (config.devtools) {
  electronDebug({ isEnabled: true, showDevTools: true })
}

let mainWindow: BrowserWindow | null | undefined
let rendererLogger: Logger

app.prependOnceListener('ready', startUp)
if (config.devtools) {
  void installDevtools()
}

app.once('window-all-closed', () => {
  log.debug('all windows closed, quitting the app')
  closeAllNotifyConnections()
    .then(() => {
      app.quit()
    })
    .catch(error => {
      log.warn('Failed to properly close MQTT connections:', error)
      app.quit()
    })
})

function startUp(): void {
  log.info('Starting App')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))
  process.on('unhandledRejection', reason =>
    log.error('Uncaught Promise rejection: ', { reason })
  )

  db.initDb()
    .then(() => {
      log.info('Database initialized successfully')

      mainWindow = createUi()
      rendererLogger = createRendererLogger()

      mainWindow.once('closed', () => (mainWindow = null))

      contextMenu({
        menu: actions => {
          return config.devtools
            ? [actions.copy({}), actions.searchWithGoogle({}), actions.inspect()]
            : [actions.copy({}), actions.searchWithGoogle({})]
        },
      })

      initializeMenu()

      const dispatch: Dispatch = action => {
        if (mainWindow) {
          log.silly('Sending action via IPC to renderer', { action })
          mainWindow.webContents.send('dispatch', action)
        }
      }

      const actionHandlers: Dispatch[] = [
        registerConfig(dispatch),
        registerDiscovery(dispatch),
        registerProtocolAnalysis(dispatch, mainWindow),
        registerUpdate(dispatch),
        registerRobotUpdate(dispatch),
        registerLabware(dispatch, mainWindow),
        registerSystemInfo(dispatch),
        registerProtocolStorage(dispatch),
        registerUsb(dispatch),
        registerNotify(dispatch, mainWindow),
        registerReloadUi(mainWindow),
        registerSystemLanguage(dispatch),
      ]

      ipcMain.on('dispatch', (_, action) => {
        log.debug('Received action via IPC from renderer', { action })
        actionHandlers.forEach(handler => {
          handler(action as Action)
        })
      })

      log.silly('Global references', { mainWindow, rendererLogger })
    })
    .catch((error: Error) => {
      log.error('Error initializing database', { error })
      app.quit()
    })
}

function createRendererLogger(): Logger {
  log.info('Creating renderer logger')
  const logger = createLogger('renderer')
  ipcMain.on('log', (_, info) => logger.log(info as LogEntry))
  return logger
}

async function installDevtools(): Promise<void> {
  const extensions = [
    electronDevtoolsInstaller.REACT_DEVELOPER_TOOLS,
    electronDevtoolsInstaller.REDUX_DEVTOOLS,
  ]
  const install = electronDevtoolsInstaller.default
  const forceReinstall = config.reinstallDevtools

  log.debug('Installing devtools')

  try {
    await install(extensions, {
      loadExtensionOptions: { allowFileAccess: true },
      forceDownload: forceReinstall,
    })
    log.debug('Devtools extensions installed')
  } catch (error: unknown) {
    log.warn('Failed to install devtools extensions', {
      forceReinstall,
      error,
    })
  }
}