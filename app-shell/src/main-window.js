/* globals events$EventEmitter */
// @flow
// sets up the main window ui
import { app, shell, BrowserWindow } from 'electron'
import path from 'path'
import { getFullConfig } from './config'
import { createLogger } from './log'

export interface WebContents extends events$EventEmitter {
  send: (channel: string, ...args: Array<mixed>) => void;
}

export interface MainWindow extends events$EventEmitter {
  show: () => void;
  loadURL: (url: string, options: { ... }) => void;
  webContents: WebContents;
}

const log = createLogger('ui')

// hold on to main reference so it doesn't get garbage collected
let _mainWindow: MainWindow | null = null

export function createMainWindow(): MainWindow | null {
  const config = getFullConfig().ui
  const urlPath =
    config.url.protocol === 'file:'
      ? path.join(app.getAppPath(), config.url.path)
      : config.url.path

  const url = `${config.url.protocol}//${urlPath}`

  const windowOpts = {
    show: false,
    useContentSize: true,
    width: config.width,
    height: config.height,
    // allow webPreferences to be set at launchtime from config
    webPreferences: {
      // NOTE: __dirname refers to output directory
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      ...config.webPreferences,
    },
  }

  if (!config.externalBrowser) {
    log.debug('Creating main window', { windowOpts })

    _mainWindow = (new BrowserWindow(windowOpts): MainWindow)

    _mainWindow
      .once('ready-to-show', () => {
        log.debug('Main window ready to show')
        _mainWindow && _mainWindow.show()
      })
      .once('closed', () => (_mainWindow = null))

    log.info(`Loading ${url}`)
    _mainWindow.loadURL(url, { extraHeaders: 'pragma: no-cache\n' })

    // open new windows (<a target="_blank" ...) in browser windows
    _mainWindow.webContents.on('new-window', (event, externalUrl) => {
      log.debug('Opening external link', { externalUrl })
      event.preventDefault()
      shell.openExternal(externalUrl)
    })
  } else {
    log.info('app running in headless mode; not creating window')
  }

  return _mainWindow
}

export function getMainWindow(): MainWindow | null {
  return _mainWindow
}
