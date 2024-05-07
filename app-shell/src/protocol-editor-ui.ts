// sets up the main window ui
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

import { getConfig } from './config'
import { createLogger } from './log'
import { PROTOCOLS_DIRECTORY_PATH, analyzeProtocolByKey, getProtocolSourceJSON, overwriteProtocol } from './protocol-storage/file-system'

const protocolEditorUiConfig = getConfig('protocolEditorUi')
const log = createLogger('protocolEditorUi')

const WINDOW_OPTS = {
  show: false,
  useContentSize: true,
  width: protocolEditorUiConfig.width,
  minWidth: protocolEditorUiConfig.minWidth,
  height: protocolEditorUiConfig.height,
  // allow webPreferences to be set at launchtime from config
  webPreferences: Object.assign(
    {
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      // TODO: remove this by using electron contextBridge to specify
      // exact, argument-sanitation-involved methods instead of just
      // binding the entire ipcRenderer in. This is necessary because
      // as of electron 12, contextIsolation defaults to true.
      contextIsolation: false,
    },
    protocolEditorUiConfig.webPreferences
  ),
}


const protocolEditorPath =
  protocolEditorUiConfig.url.protocol === 'file:'
    ? path.join(app.getAppPath(), protocolEditorUiConfig.url.path)
    : protocolEditorUiConfig.url.path

export function createProtocolEditorUi(srcFilePath: string): BrowserWindow {
  log.debug('Creating protocol editor window', { options: WINDOW_OPTS })

  const subWindow = new BrowserWindow(WINDOW_OPTS).once(
    'ready-to-show',
    () => {
      log.debug('Protocol Editor window ready to show')
      subWindow.show()
    }
  )
  const protocolEditorUrl = `${protocolEditorUiConfig.url.protocol}//${protocolEditorPath}`

  log.info(`Loading ${protocolEditorUrl}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  subWindow.loadURL(protocolEditorUrl)

  // open new windows (<a target="_blank" ...) in browser windows
  subWindow.webContents.setWindowOpenHandler(({ url }) => {
    log.debug('Opening external link', { url })
    // event.preventDefault()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
    return { action: 'deny' }
  })

  subWindow.webContents.once('dom-ready', () => {
    const protocolSourceJSON = getProtocolSourceJSON(srcFilePath)
    protocolSourceJSON.then(json => {
      subWindow.webContents.send('open-protocol-in-designer', json)
      ipcMain.once('save-protocol-file-to-filesystem', (_event, fileName, fileData) => {
        overwriteProtocol(srcFilePath, fileName, fileData).then(() => {
          const { protocolKey } = /.*\/(?<protocolKey>.*)\/src.*/.exec(srcFilePath)?.groups ?? {}
          return analyzeProtocolByKey(
            protocolKey,
            PROTOCOLS_DIRECTORY_PATH
          )
        })
      })
    })
  });

  return subWindow
}
