// sets up the main window ui
import { app, shell, BrowserWindow } from 'electron'
import path from 'path'

import { getConfig } from './config'
import { RELOAD_UI } from './constants'
import { createLogger } from './log'

import type { Action } from './types'

const uiConfig = getConfig('ui')
const log = createLogger('ui')

const urlPath =
  uiConfig.url.protocol === 'file:'
    ? path.join(app.getAppPath(), uiConfig.url.path)
    : uiConfig.url.path

const url = `${uiConfig.url.protocol}//${urlPath}`

const WINDOW_OPTS = {
  show: false,
  useContentSize: true,
  width: uiConfig.width,
  minWidth: uiConfig.minWidth,
  height: uiConfig.height,
  // allow webPreferences to be set at launchtime from uiConfig
  webPreferences: Object.assign(
    {
      // NOTE: __dirname refers to output directory
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      // TODO: remove this by using electron contextBridge to specify
      // exact, argument-sanitation-involved methods instead of just
      // binding the entire ipcRenderer in. This is necessary because
      // as of electron 12, contextIsolation defaults to true.
      contextIsolation: false,
    },
    uiConfig.webPreferences
  ),
}

export function createUi(): BrowserWindow {
  log.debug('Creating main window', { options: WINDOW_OPTS })

  const mainWindow = new BrowserWindow(WINDOW_OPTS).once(
    'ready-to-show',
    () => {
      log.debug('Main window ready to show')
      mainWindow.show()
    }
  )

  log.info(`Loading ${url}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  mainWindow.loadURL(url, { extraHeaders: 'pragma: no-cache\n' })

  // open new windows (<a target="_blank" ...) in browser windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // eslint-disable-next-line no-void
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
}

export function registerReloadUi(
  browserWindow: BrowserWindow
): (action: Action) => unknown {
  return function handleAction(action: Action) {
    switch (action.type) {
      case RELOAD_UI:
        log.info(`reloading UI: ${action.payload.message}`)
        browserWindow.webContents.reload()

        break
    }
  }
}
