// app updater
'use strict'

const {app, dialog, autoUpdater} = require('electron')
const log = require('electron-log')

const {getSetting} = require('./preferences')

const UPDATE_SERVER_URL = 'http://ot-app-releases-2.herokuapp.com'
const AUTO_UPDATE_URL = UPDATE_SERVER_URL + '?version=' + app.getVersion()

module.exports = function initAutoUpdater () {
  log.info('Initializing Auto Updater')

  autoUpdater.on('error', (err) => log.info(`Update error: ${err.message}`))
  autoUpdater.on('checking-for-update', () => log.info('Checking for update'))
  autoUpdater.on('update-available', () => log.info('Update available'))
  autoUpdater.on('update-not-available', () => log.info('Update not available'))
  autoUpdater.on('update-downloaded', (e, notes, name, date, url) => {
    log.info(`Update downloaded: ${name}: ${url}`)
    log.info(`Update Info: ${notes}`)

    const index = dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'OT App', // TODO: Make this a config
      message: 'A new version has been downloaded. Please restart the application to apply the updates.',
      detail: name + '\n\n' + notes
    })

    if (index === 1) {
      return
    }

    autoUpdater.quitAndInstall()
  })

  //  If platform is Windows, use S3 file server instead of update server.
  //  please see /docs/windows_updating.txt for more information
  const updateUrl = (process.platform === 'win32')
    ? 'https://s3.amazonaws.com/ot-app-win-updates-2/'
    : AUTO_UPDATE_URL

  log.info(`Setting auto-update URL to ${updateUrl}`)
  autoUpdater.setFeedURL(updateUrl)

  if (getSetting('autoUpdate')) {
    log.info('Auto updating is enabled, checking for updates')
    autoUpdater.checkForUpdates()
  } else {
    log.info('Auto updating disabled in settings, skipping checkForUpdates')
  }
}
