// sets up the main window ui
import { app, BrowserWindow } from 'electron'
import path from 'path'
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

export function waitForRobotServerAndShowMainWindow(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): void {
  mainWindow.show()
  process.env.NODE_ENV !== 'development' &&
    setTimeout(function () {
      systemd
        .getisRobotServerReady()
        .then((isReady: boolean) => {
          dispatch(sendReadyStatus(isReady))
          if (!isReady) {
            waitForRobotServerAndShowMainWindow(dispatch, mainWindow)
          }
        })
        .catch(e => {
          log.debug('Could not get status of robot server service', { e })
          waitForRobotServerAndShowMainWindow(dispatch, mainWindow)
        })
    }, 1500)
}
