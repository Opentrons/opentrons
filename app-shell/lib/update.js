// app updater
'use strict'

const {autoUpdater: updater} = require('electron-updater')
const {getConfig} = require('./config')
const log = require('./log')(__filename)

updater.logger = log
updater.autoDownload = false

module.exports = {
  CURRENT_VERSION: updater.currentVersion,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall
}

function checkForUpdates () {
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

function downloadUpdate () {
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

function quitAndInstall () {
  return updater.quitAndInstall()
}

// TODO(mc, 2018-03-29): this only exists to support RPC in a webworker;
//   remove when RPC is gone
function PlainObjectError (error) {
  return {name: error.name, message: error.message}
}
