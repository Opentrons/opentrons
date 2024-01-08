// electron main entry point
import { app, ipcMain, crashReporter } from 'electron'
import fse from 'fs-extra'
import path from 'path'
import { createUi } from './ui'
import { createLogger } from './log'
import { registerDiscovery } from './discovery'
import {
  registerUpdate,
  updateLatestVersion,
  registerUpdateBrightness,
} from './update'
import { registerRobotSystemUpdate } from './system-update'
import { registerAppRestart } from './restart'
import {
  getConfig,
  getStore,
  getOverrides,
  registerConfig,
  resetStore,
  ODD_DIR,
} from './config'
import systemd from './systemd'
import { watchForMassStorage } from './usb'

import type { BrowserWindow } from 'electron'
import type { Dispatch, Logger } from './types'

// app.setPath('crashDumps', '/data/ODD')
// crashReporter.start({
//   uploadToServer: false,
// })
// eslint-disable-next-line no-void
void systemd.sendStatus('starting app')
const config = getConfig()
const log = createLogger('main')

log.debug('App config', {
  config,
  store: getStore(),
  overrides: getOverrides(),
})

// eslint-disable-next-line no-void
void systemd.setRemoteDevToolsEnabled(config.devtools)

// hold on to references so they don't get garbage collected
let mainWindow: BrowserWindow | null | undefined
let rendererLogger: Logger

// prepended listener is important here to work around Electron issue
// https://github.com/electron/electron/issues/19468#issuecomment-623529556
app.prependOnceListener('ready', startUp)
if (config.devtools) app.once('ready', installDevtools)

app.once('window-all-closed', () => {
  log.debug('all windows closed, quitting the app')
  app.quit()
})

function startUp(): void {
  log.info('Starting App')
  // console.log('Starting App')
  const storeNeedsReset = fse.existsSync(
    path.join(ODD_DIR, `_CONFIG_TO_BE_DELETED_ON_REBOOT`)
  )
  if (storeNeedsReset) {
    log.debug('store marked to be reset, resetting store')
    resetStore()
    fse.removeSync(path.join(ODD_DIR, `_CONFIG_TO_BE_DELETED_ON_REBOOT`))
  }
  // eslint-disable-next-line no-void
  void systemd.sendStatus('loading app')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))
  process.on('unhandledRejection', reason =>
    log.error('Uncaught Promise rejection: ', { reason })
  )
  log.info('before dispatch')
  // wire modules to UI dispatches
  const dispatch: Dispatch = action => {
    log.info('inside dispatch')
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (mainWindow) {
      log.silly('Sending action via IPC to renderer', { action })
      log.info('before send', action)
      mainWindow.webContents.send('dispatch', action)
      log.info('after send')
    }
  }
  log.info('Before createUI')
  log.info('dispatch', dispatch)
  mainWindow = createUi(dispatch)
  rendererLogger = createRendererLogger()

  mainWindow.once('closed', () => (mainWindow = null))

  log.info('Fetching latest software version')
  updateLatestVersion().catch((error: Error) => {
    log.error('Error fetching latest software version: ', { error })
  })

  const actionHandlers: Dispatch[] = [
    registerConfig(dispatch),
    registerDiscovery(dispatch),
    registerUpdate(dispatch),
    registerRobotSystemUpdate(dispatch),
    registerAppRestart(),
    registerUpdateBrightness(),
  ]

  ipcMain.on('dispatch', (_, action) => {
    log.info('on: dispatch')
    log.debug('Received action via IPC from renderer', { action })
    actionHandlers.forEach(handler => handler(action))
    log.info('after forEach')
  })

  log.silly('Global references', { mainWindow, rendererLogger })

  ipcMain.once('dispatch', () => {
    log.info('systemd dispatch start')
    log.info('before calling systemd.sendStatus')
    // eslint-disable-next-line no-void
    void systemd.sendStatus('started')
    log.info('before calling systemd.ready')
    // eslint-disable-next-line no-void
    void systemd.ready()
    log.info('before calling watchForMassStorage')
    const stopWatching = watchForMassStorage(dispatch)
    ipcMain.once('quit', stopWatching)
    log.info('systemd dispatch end')
  })
}

function createRendererLogger(): Logger {
  log.info('Creating renderer logger')

  const logger = createLogger('renderer')
  ipcMain.on('log', (_, info) => logger.log(info))

  return logger
}

function installDevtools(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const devtools = require('electron-devtools-installer')
  const extensions = [devtools.REACT_DEVELOPER_TOOLS, devtools.REDUX_DEVTOOLS]
  const install = devtools.default
  const forceReinstall = config.reinstallDevtools

  log.debug('Installing devtools')

  install(extensions, forceReinstall)
    .then(() => log.debug('Devtools extensions installed'))
    .catch((error: unknown) => {
      log.warn('Failed to install devtools extensions', {
        forceReinstall,
        error,
      })
    })
}
