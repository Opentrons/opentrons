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
  minWidth: config.minWidth,
  height: config.height,
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
    if (url.startsWith('http://localhost:8090')) {
      log.debug('Opening external link', { url })
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      shell.openExternal(url)
      // return { action: 'allow' }
      return { action: 'allow' }
    } else {
      console.log("Blocked by 'setWindowOpenHandler'")
      return { action: 'deny' }
    }
  })

  return mainWindow
}
