// sets up the main window ui
import path from 'path'
import { app, shell, BrowserWindow } from 'electron'
import { getFullConfig } from './config'
import { createLogger } from './log'

const log = createLogger('main-window')

// hold on to main reference so it doesn't get garbage collected
let _mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow | null {
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

  if (Boolean(config.externalBrowser)) {
    log.info('app running in headless mode; not creating window')
    return null
  }

  log.debug('Creating main window', { windowOpts })

  _mainWindow = new BrowserWindow(windowOpts)

  _mainWindow
    .once('ready-to-show', () => {
      log.debug('Main window ready to show')
      _mainWindow?.show()
    })
    .once('closed', () => (_mainWindow = null))

  log.info(`Loading ${url}`)

  _mainWindow
    .loadURL(url, { extraHeaders: 'pragma: no-cache\n' })
    .catch(error => log.error('Main window failed to load', { error }))

  // open new windows (<a target="_blank" ...) in browser windows
  _mainWindow.webContents.on('new-window', (event, externalUrl) => {
    log.debug('Opening external link', { externalUrl })
    event.preventDefault()
    shell
      .openExternal(externalUrl)
      .catch(error => log.warn('Failed to open external link', { error }))
  })

  return _mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return _mainWindow
}
