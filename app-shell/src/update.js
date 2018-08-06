// app updater
import {autoUpdater as updater} from 'electron-updater'

import createLogger from './log'
import {getConfig} from './config'

updater.logger = createLogger(__filename)
updater.autoDownload = false

export const CURRENT_VERSION = updater.currentVersion

export function checkForUpdates () {
  return new Promise((resolve, reject) => {
    updater.once('update-available', handleUpdateAvailable)
    updater.once('update-not-available', handleUpdateNotAvailable)
    updater.once('error', handleError)
    updater.channel = getConfig('update.channel')
    updater.checkForUpdates()

    function handleUpdateAvailable (info) {
      cleanup()
      resolve(Object.assign({updateAvailable: true}, info))
    }

    function handleUpdateNotAvailable (info) {
      cleanup()
      resolve(Object.assign({updateAvailable: false}, info))
    }

    function handleError (error) {
      cleanup()
      reject(PlainObjectError(error))
    }

    function cleanup () {
      updater.removeListener('update-available', handleUpdateAvailable)
      updater.removeListener('update-not-available', handleUpdateNotAvailable)
      updater.removeListener('error', handleError)
    }
  })
}

export function downloadUpdate () {
  return new Promise((resolve, reject) => {
    updater.once('update-downloaded', handleUpdateDownloaded)
    updater.once('error', handleError)
    updater.downloadUpdate()

    function handleUpdateDownloaded () {
      cleanup()
      resolve()
    }

    function handleError (error) {
      cleanup()
      reject(PlainObjectError(error))
    }

    function cleanup () {
      updater.removeListener('update-downloaded', handleUpdateDownloaded)
      updater.removeListener('error', handleError)
    }
  })
}

export function quitAndInstall () {
  return updater.quitAndInstall()
}

// TODO(mc, 2018-03-29): this only exists to support RPC in a webworker;
//   remove when RPC is gone
function PlainObjectError (error) {
  return {name: error.name, message: error.message}
}
