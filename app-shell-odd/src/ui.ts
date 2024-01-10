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

  const mainWindow = new BrowserWindow(WINDOW_OPTS)
  mainWindow.show()
  mainWindow.once('ready-to-show', () => {
    log.debug('Main window ready to show')
    log.info('before show')
    mainWindow.show()
    log.info('after show')
    process.env.NODE_ENV !== 'development' &&
      waitForRobotServerAndShowMainWIndow(dispatch)
  })
  log.info('after ready-to-show')

  // test
  mainWindow.webContents.on('will-navigate', () => {
    log.info('will-navigate')
  })

  const pollWCStatus = (): void => {
    log.info(`isCrashed: ${mainWindow.webContents.isCrashed()}`)
    log.info(`isLoading: ${mainWindow.webContents.isLoading()}`)
    log.info(
      `isLoadingMainFrame: ${mainWindow.webContents.isLoadingMainFrame()}`
    )
    log.info(
      `isWaitingForResponse: ${mainWindow.webContents.isWaitingForResponse()}`
    )
    log.info(`isDestroyed: ${mainWindow.webContents.isDestroyed()}`)
    log.info(`isPainting: ${mainWindow.webContents.isPainting()}`)
    log.info(`isOffscreen: ${mainWindow.webContents.isOffscreen()}`)
    log.info(`isFocused: ${mainWindow.webContents.isFocused()}`)
    if (!mainWindow.webContents.isWaitingForResponse()) {
      setTimeout(pollWCStatus, 5000)
    } else {
      setTimeout(pollWCStatus, 100)
    }
  }

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
      log.info(`did-fail-provisional-load ${errorCode}
      `)
      log.info(`did-fail-provisional-load ${validatedURL}
      `)
      log.info(`did-fail-provisional-load ${errorDescription}
      `)
    }
  )

  mainWindow.webContents.on(
    'did-fail-provisional-load',
    (
      event,
      errorCode,
      errorDescription,
      validatedURL
      // isMainFrame,
      // frameProcessId,
      // frameRoutingId
    ) => {
      log.info(`did-fail-provisional-load ${errorCode}
      `)
      log.info(`did-fail-provisional-load ${validatedURL}
      `)
      log.info(`did-fail-provisional-load ${errorDescription}
      `)
    }
  )

  mainWindow.webContents.on('did-attach-webview', () => {
    log.info(`did-attach-webview`)
  })

  log.info(`mainWindow: ${JSON.stringify(mainWindow, null, 4)}`)

  log.info(`Loading ${url}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  mainWindow
    .loadURL(url, { extraHeaders: 'pragma: no-cache\n' })
    .then(() => log.info('loadURL is fine'))
    .catch((e: any) => log.info('load url error', e))
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
