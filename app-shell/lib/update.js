// app updater
'use strict'

const log = require('electron-log')
const {autoUpdater: updater} = require('electron-updater')

updater.logger = log
updater.autoDownload = false

module.exports = {
  getCurrentVersion,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall
}

function getCurrentVersion () {
  return updater.currentVersion
}

function checkForUpdates () {
  return new Promise((resolve, reject) => {
    updater.once('update-available', handleUpdateAvailable)
    updater.once('update-not-available', handleUpdateNotAvailable)
    updater.once('error', handleError)
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
      reject(error)
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
      reject(error)
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
