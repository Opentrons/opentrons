// sets up the main window ui
import { app, shell, BrowserWindow } from 'electron'
import path from 'path'
import { getConfig } from './config'
import { createLogger } from './log'

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
  height: config.height,
  // allow webPreferences to be set at launchtime from config
  webPreferences: Object.assign(
    {
      // NOTE: __dirname refers to output directory
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
    },
    config.webPreferences
  ),
}

export function createUi() {
  log.debug('Creating main window', { options: WINDOW_OPTS })

  const mainWindow = new BrowserWindow(WINDOW_OPTS).once(
    'ready-to-show',
    () => {
      log.debug('Main window ready to show')
      mainWindow.show()
    }
  )

  log.info(`Loading ${url}`)
  mainWindow.loadURL(url, { extraHeaders: 'pragma: no-cache\n' })

  // open new windows (<a target="_blank" ...) in browser windows
  mainWindow.webContents.on('new-window', (event, url) => {
    log.debug('Opening external link', { url })
    event.preventDefault()
    shell.openExternal(url)
  })

  return mainWindow
}
