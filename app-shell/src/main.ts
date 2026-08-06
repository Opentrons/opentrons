// electron main entry point
import dns from 'dns'
import { app, BrowserWindow, ipcMain } from 'electron'
import contextMenu from 'electron-context-menu'
import electronDebug from 'electron-debug'
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'

import { registerCertIPC } from './certs'
import { getConfig, getOverrides, getStore, registerConfig } from './config'
import {
  initializeDiscovery,
  registerDiscoveryMainWindow,
  registerDiscoverySecondaryWindow,
  unregisterDiscovery,
} from './discovery'
import { registerLabware } from './labware'
import { createLogger } from './log'
import { registerLogLocation } from './log-location'
import { initializeMenu } from './menu'
import { closeAllNotifyConnections, registerNotify } from './notifications'
import { registerProtocolAnalysis } from './protocol-analysis'
import { registerProtocolStorage } from './protocol-storage'
import { registerRobotUpdate } from './robot-update'
import {
  clearMainWindow,
  closeSecondaryWindows,
  registerCameraStream,
  setMainWindow,
} from './secondary-windows'
import { initializeSentry } from './sentry'
import { registerSystemInfo } from './system-info'
import {
  createUi,
  registerOT2AppOpen,
  registerReloadUi,
  registerSystemLanguage,
} from './ui'
import { registerUpdate } from './update'
import { registerUsb } from './usb'

import type { LogEntry } from 'winston'
import type { Action, Dispatch, Logger } from './types'

const PROTOCOL_NAME = 'com-opentrons-flex-app'

/**
 * node 17 introduced a change to default IP resolving to prefer IPv6 which causes localhost requests to fail
 * setting the default to IPv4 fixes the issue
 * https://github.com/node-fetch/node-fetch/issues/1624
 */
dns.setDefaultResultOrder('ipv4first')

const config = getConfig()
const log = createLogger('main')

log.debug('App config', {
  config,
  store: getStore(),
  overrides: getOverrides(),
})

// Initialize Sentry before the app is ready.
initializeSentry(getStore().analytics.optedIn)

if (config.devtools) {
  electronDebug({ isEnabled: true, showDevTools: true })
}

// hold on to references so they don't get garbage collected
let mainWindow: BrowserWindow | null | undefined
let rendererLogger: Logger

interface HandlerSet {
  handlers: Dispatch[]
  dispatch: Dispatch
}
// Handler caching using window ID as key
const handlerSets = new Map<string, HandlerSet>()

app
  .whenReady()
  .then(async () => {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME)
    await startUp()

    if (config.devtools) {
      await installDevtools()

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.openDevTools({ mode: 'detach' })
      }
    }
  })
  .catch(err => log.error('Startup failed', { err }))

app.once('window-all-closed', () => {
  log.debug('all windows closed, quitting the app')
  app.quit()
  closeAllNotifyConnections()
    .then(() => {
      app.quit()
    })
    .catch(error => {
      log.warn('Failed to properly close MQTT connections:', error)
      app.quit()
    })
})

function isMainWindow(window: BrowserWindow): boolean {
  return mainWindow != null && window.id === mainWindow.id
}

function getOrCreateHandlerSet(window: BrowserWindow): HandlerSet | null {
  const windowId = `${window.id}`

  if (!handlerSets.has(windowId)) {
    const dispatch = createDispatchForWindow(window)

    const handlers: Dispatch[] = isMainWindow(window)
      ? [
          registerConfig(dispatch),
          registerDiscoveryMainWindow(dispatch),
          registerProtocolAnalysis(dispatch, window),
          registerUpdate(dispatch),
          registerRobotUpdate(dispatch),
          registerLabware(dispatch, window),
          registerLogLocation(dispatch, window),
          registerSystemInfo(dispatch),
          registerProtocolStorage(dispatch, window),
          registerUsb(dispatch),
          registerNotify(dispatch, window),
          registerReloadUi(window),
          registerSystemLanguage(dispatch),
          registerCameraStream(dispatch),
          registerOT2AppOpen(),
        ]
      : // Only register necessary subset for secondary windows.
        [
          registerConfig(dispatch),
          registerDiscoverySecondaryWindow(dispatch),
          registerUsb(dispatch),
          registerSystemInfo(dispatch),
          registerNotify(dispatch, window),
          registerReloadUi(window),
          registerSystemLanguage(dispatch),
          registerCameraStream(dispatch),
          registerOT2AppOpen(),
        ]

    handlerSets.set(windowId, { handlers, dispatch })

    window.on('closed', () => {
      unregisterDiscovery(dispatch)
      handlerSets.delete(windowId)
      log.debug(`Cleaned up handlers for ${windowId}`)
    })

    log.debug(
      `Created handler set for ${windowId}, isMain: ${isMainWindow(window)}`
    )
  }

  const handlerSet = handlerSets.get(windowId)
  if (handlerSet == null) {
    log.error('Attempted to access dispatches for unhandled window.')
  }

  return handlerSet ?? null
}

async function startUp(): Promise<void> {
  log.info('Starting App')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))
  process.on('unhandledRejection', reason =>
    log.error('Uncaught Promise rejection: ', { reason })
  )

  initializeDiscovery()
  mainWindow = createUi()
  setMainWindow(mainWindow)
  rendererLogger = createRendererLogger()

  mainWindow.once('closed', () => {
    clearMainWindow()
    mainWindow = null
    closeSecondaryWindows()
  })

  contextMenu({
    menu: actions => {
      return config.devtools
        ? [actions.copy({}), actions.searchWithGoogle({}), actions.inspect()]
        : [actions.copy({}), actions.searchWithGoogle({})]
    },
  })

  initializeMenu()

  ipcMain.on('secondary-window:close-self', event => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    if (senderWindow != null && !senderWindow.isDestroyed()) {
      senderWindow.close()
    }
  })

  ipcMain.on('dispatch', (event, action) => {
    log.debug('Received action via IPC from renderer', { action })

    const senderWindow = BrowserWindow.getAllWindows().find(
      win => win.webContents === event.sender
    )

    if (senderWindow != null) {
      const handlerSet = getOrCreateHandlerSet(senderWindow)

      if (handlerSet != null) {
        const { handlers } = handlerSet

        handlers.forEach(handler => {
          handler(action as Action)
        })
      }
    } else {
      log.error(
        `Could not find requested window from IPC dispatch: ${event.sender.getURL()}`
      )
    }
  })
  await registerCertIPC()

  log.silly('Global references', { mainWindow, rendererLogger })
}

function createRendererLogger(): Logger {
  log.info('Creating renderer logger')

  const logger = createLogger('renderer')
  ipcMain.on('log', (_, info) => logger.log(info as LogEntry))

  return logger
}

async function installDevtools(): Promise<void> {
  const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS]

  log.debug('Installing devtools with v4 API')

  try {
    await installExtension(extensions, {
      loadExtensionOptions: { allowFileAccess: true },
      forceDownload: config.reinstallDevtools,
    })

    log.debug('Devtools extensions installed')
  } catch (error) {
    log.warn('Failed to install devtools extensions', {
      forceReinstall: config.reinstallDevtools,
      error,
    })
  }
}

const createDispatchForWindow = (
  targetWindow: BrowserWindow | null | undefined
): Dispatch => {
  return (action: Action) => {
    if (targetWindow && !targetWindow.isDestroyed()) {
      log.silly('Sending action via IPC to renderer', { action })
      targetWindow.webContents.send('dispatch', action)
    }
  }
}
