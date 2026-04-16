// sets up the main window ui
import path from 'path'
import { app, BrowserWindow } from 'electron'

import { sendReadyStatus } from './actions'
import { getConfig } from './config'
import { createLogger } from './log'
import systemd from './systemd'

import type { Dispatch } from './types'

const config = getConfig('ui')
const log = createLogger('ui')

const urlPath =
  config.url.protocol === 'file:'
    ? path.join(app.getAppPath(), config.url.path)
    : config.url.path

const url = `${config.url.protocol}//${urlPath}`

const WINDOW_OPTS = {
  show: false,
  useContentSize: true,
  width: config.width,
  minWidth: config.minWidth,
  height: config.height,
  minHeight: config.minHeight,
  frame: false, // hide menubar
  // allow webPreferences to be set at launchtime from config
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
    config.webPreferences
  ),
}

const READY_POLL_INTERVAL_MS = 1500

export function createUi(dispatch: Dispatch): BrowserWindow {
  log.debug('Creating main window', { options: WINDOW_OPTS })

  const mainWindow = new BrowserWindow(WINDOW_OPTS)
  // TODO: In the app, we immediately do .once('ready-to-show', () => { mainWindow.show() }). We don't do that
  // here because in electron 27.0.0 for some reason ready-to-show isn't firing, so instead we use "the app sent
  // something via IPC" as our signifier that the window can bw shown. This happens in main.ts.
  // This is a worrying thing to have to do, and it would be good to stop doing it. We'll have to change this
  // further when we upgrade past 27.

  log.info(`Loading ${url}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  mainWindow.loadURL(url, { extraHeaders: 'pragma: no-cache\n' })

  // never allow external links to open
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  return mainWindow
}

export function waitForBackendAndShowMainWindow(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): void {
  mainWindow.show()
  mainWindow.webContents.send('window-type', 'odd-main')

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('window-type', 'odd-main')
  })

  // prevent fullscreen for safe
  mainWindow.setFullScreen(false)

  // prevent Electron shortcuts that Desktop app shows in menu
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase()
    const ctrlOrMeta = input.control || input.meta
    const ctrlMeta = input.control && input.meta

    // Open Chrome Devtools: Ctrl + Shift + i / ⌘+⌥+I
    const isDevToolsByShift = ctrlOrMeta && input.shift && key === 'i'
    const isDevToolsByAltMeta = input.meta && input.alt && key === 'i'
    const isDevTools = isDevToolsByShift || isDevToolsByAltMeta

    // Reload Ctrl + R / Ctrl + Shift + R
    const isReload = ctrlOrMeta && key === 'r'

    // Zoom In: add is for numpad
    const isPlusKey = key === '+' || key === '=' || key === 'add'
    const isZoomIn = ctrlOrMeta && isPlusKey

    // Zoom Out: subtract is for numpad
    const isMinusKey = key === '-' || key === '_' || key === 'subtract'
    const isZoomOut = ctrlOrMeta && isMinusKey

    // Actual Size Cmd + 0/ Ctrl + 0
    // This might not be needed since this shortcut is used when zooming in/out
    const isActualZoom = ctrlOrMeta && key === '0'

    const isFullScreen = (ctrlMeta && key === 'f') || key === 'f11'

    if (
      isDevTools ||
      isReload ||
      isZoomIn ||
      isZoomOut ||
      isActualZoom ||
      isFullScreen
    ) {
      event.preventDefault()
    }
  })

  _NODE_ENV_ !== 'development' &&
    setTimeout(function () {
      systemd
        .getIsBackendReady()
        .then((isReady: boolean) => {
          dispatch(sendReadyStatus(isReady))
          if (!isReady) {
            waitForBackendAndShowMainWindow(dispatch, mainWindow)
          }
        })
        .catch(e => {
          log.debug('Could not get status of backend services', { e })
          waitForBackendAndShowMainWindow(dispatch, mainWindow)
        })
    }, READY_POLL_INTERVAL_MS)
}
