// sets up the main window ui
import { app, shell, BrowserWindow } from 'electron'
import path from 'path'
import { sendReadyStatus } from '@opentrons/app/src/redux/shell'
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
  paintWhenInitiallyHidden: true,
  frame: false, // hide menubar
  // allow webPreferences to be set at launchtime from config
  webPreferences: Object.assign(
    {
      // NOTE: __dirname refers to output directory
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: true,
      // TODO: remove this by using electron contextBridge to specify
      // exact, argument-sanitation-involved methods instead of just
      // binding the entire ipcRenderer in. This is necessary because
      // as of electron 12, contextIsolation defaults to true.
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
      allowRunningInsecureContent: true,
    },
    config.webPreferences
  ),
}

export function createUi(dispatch: Dispatch): BrowserWindow {
  log.debug('dispatch', dispatch)
  log.info('hello')
  log.debug('Creating main window', { options: WINDOW_OPTS })
  log.info('before ready-to-show')

  const mainWindow = new BrowserWindow(WINDOW_OPTS).once(
    'ready-to-show',
    () => {
      log.debug('Main window ready to show')
      log.info('before show')
      mainWindow.show()
      log.info('after show')
      process.env.NODE_ENV !== 'development' &&
        waitForRobotServerAndShowMainWIndow(dispatch)
    }
  )
  log.info('after ready-to-show')

  // test
  mainWindow.webContents.on('will-navigate', () => {
    log.info('will-navigate')
  })

  mainWindow.webContents.on('dom-ready', () => {
    log.info('dom-ready')
  })

  mainWindow.webContents.on('did-create-window', () => {
    log.info('did-create-window')
  })

  mainWindow.webContents.on('did-attach-webview', () => {
    log.info('did-attach-webview')
  })

  mainWindow.webContents.on('did-finish-load', () =>
    log.info('did-finish-load')
  )

  mainWindow.webContents.on(
    'did-fail-load',
    (
      event,
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
      frameProcessId,
      frameRoutingId
    ) => {
      log.info('did-fail-load', {
        event,
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame,
        frameProcessId,
        frameRoutingId,
      })
    }
  )

  mainWindow.webContents.on(
    'did-fail-provisional-load',
    (
      event,
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
      frameProcessId,
      frameRoutingId
    ) => {
      log.info('did-fail-provisional-load', {
        event,
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame,
        frameProcessId,
        frameRoutingId,
      })
    }
  )

  log.info('isCrashed', mainWindow.webContents.isCrashed())

  log.info('did-start-loading', () => log.info('did-start-loading'))
  log.info('did-stop-loading', () => log.info('did-stop-loading'))

  log.info(`Loading ${url}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  mainWindow
    .loadURL(url, { extraHeaders: 'pragma: no-cache\n' })
    .then(() => log.info('loadURL is fine'))
    .catch((e: any) => {
      log.info('load url error', e)
      // mainWindow.webContents.reload()
    })
  // open new windows (<a target="_blank" ...) in browser windows
  mainWindow.webContents.setWindowOpenHandler(({ url, disposition }) => {
    log.info('setWindowOpenHandler')
    if (disposition === 'new-window' && url === 'about:blank') {
      // eslint-disable-next-line no-void
      void shell.openExternal(url)
      return { action: 'deny' }
    } else {
      return {
        action: 'allow',
      }
    }
  })

  return mainWindow
}

export function waitForRobotServerAndShowMainWIndow(dispatch: Dispatch): void {
  setTimeout(function () {
    systemd
      .getisRobotServerReady()
      .then((isReady: boolean) => {
        dispatch(sendReadyStatus(isReady))
        if (!isReady) {
          waitForRobotServerAndShowMainWIndow(dispatch)
        }
      })
      .catch(e => {
        log.debug('Could not get status of robot server service', { e })
        waitForRobotServerAndShowMainWIndow(dispatch)
      })
  }, 1500)
}
