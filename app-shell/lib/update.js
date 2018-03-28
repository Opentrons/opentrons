// app updater
'use strict'

const log = require('electron-log')
const {autoUpdater} = require('electron-updater')
const semver = require('semver')

autoUpdater.logger = log
autoUpdater.autoDownload = false

module.exports = {
  getCurrentVersion,
  checkForUpdates
}

function getCurrentVersion () {
  return autoUpdater.currentVersion
}

function checkForUpdates () {
  return autoUpdater.checkForUpdates()
    .then((result) => {
      const {updateInfo: {version}} = result

      // TODO(mc, 2018-03-28): electron-updater doesn't indicate if an
      //   update is available through the promise result interface;
      //   re-evaluate this custom logic
      if (semver.gt(version, getCurrentVersion())) {
        return version
      }

      return null
    })
}
