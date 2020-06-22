// electron main entry point
import { app } from 'electron'
import contextMenu from 'electron-context-menu'

import { createMainWindow } from './main-window'
import { initializeMenu } from './menu'
import { createLogger } from './log'
import { createRemote } from './remote'
import { registerDiscovery } from './discovery'
import { registerLabware } from './labware'
import { registerRobotLogs } from './robot-logs'
import { registerUpdate } from './update'
import { registerBuildrootUpdate } from './buildroot'
import { registerSystemInfo } from './system-info'
import { getConfig, getStore, getOverrides, registerConfig } from './config'

import type { Action } from './types'

const config = getConfig()
const log = createLogger('main')

log.debug('App config', {
  config,
  store: getStore(),
  overrides: getOverrides(),
})

if (config.devtools) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('electron-debug')({ isEnabled: true, showDevTools: true })
}

// hold on to references so they don't get garbage collected
let remote

// prepended listener is important here to work around Electron issue
// https://github.com/electron/electron/issues/19468#issuecomment-623529556
app.prependOnceListener('ready', startUp)
// eslint-disable-next-line @typescript-eslint/no-misused-promises
if (config.devtools) app.once('ready', installDevtools)

app.once('window-all-closed', () => {
  log.debug('all windows closed, quitting the app')
  app.quit()
})

function startUp(): void {
  log.info('Starting App')
  process.on('uncaughtException', error => log.error('Uncaught: ', { error }))
  process.on('unhandledRejection', reason =>
    log.error('Uncaught Promise rejection: ', { reason })
  )

  createMainWindow()
  contextMenu({ showInspectElement: config.devtools })
  initializeMenu()

  // wire modules to UI dispatches
  remote = createRemote()
  const actionHandlers = [
    registerConfig(remote.dispatch),
    registerDiscovery(remote.dispatch),
    registerRobotLogs(remote.dispatch),
    registerUpdate(remote.dispatch),
    registerBuildrootUpdate(remote.dispatch),
    registerLabware(remote.dispatch),
    registerSystemInfo(remote.dispatch),
  ]

  remote.inbox.subscribe((action: Action) =>
    actionHandlers.forEach(handler => handler(action))
  )
}

function installDevtools(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const devtools = require('electron-devtools-installer')
  const extensions = [devtools.REACT_DEVELOPER_TOOLS, devtools.REDUX_DEVTOOLS]
  const install = devtools.default
  const forceReinstall = config.reinstallDevtools

  log.debug('Installing devtools')

  return install(extensions, forceReinstall)
    .then(() => log.debug('Devtools extensions installed'))
    .catch((error: unknown) => {
      log.warn('Failed to install devtools extensions', {
        forceReinstall,
        error,
      })
    })
}
