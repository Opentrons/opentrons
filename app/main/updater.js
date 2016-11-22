const electron = require("electron");
const {app, dialog, autoUpdater} = electron;
const {getSetting} = require('./preferences')
const {getLogger} = require('./logging.js')

var UPDATE_SERVER_URL =  'http://ot-app-releases-2.herokuapp.com';


function initAutoUpdater () {
  const mainLogger = getLogger('electron-main')
  mainLogger.info('starting ')

  autoUpdater.on(
    'error',
    (err) => mainLogger.info(`Update error: ${err.message}`)
  )

  autoUpdater.on(
    'checking-for-update',
    () => mainLogger.info('Checking for update')
  )

  autoUpdater.on(
    'update-available',
    () => mainLogger.info('Update available')
  )

  autoUpdater.on(
    'update-not-available',
    () => mainLogger.info('Update not available')
  )

  autoUpdater.on(
    'update-downloaded',
   function(e, releaseNotes, releaseName, date, url) {
       mainLogger.info(`Update downloaded: ${releaseName}: ${url}`)
       mainLogger.info(`Update Info: ${releaseNotes}`)

       var index = dialog.showMessageBox({
           type: 'info',
           buttons: ['Restart','Later'],
           title: "OT App", // TODO: Make this a config
           message: 'The new version has been downloaded. Please restart the application to apply the updates.',
           detail: releaseName + "\n\n" + releaseNotes
       });

       if (index === 1) {
           return;
       }

       autoUpdater.quitAndInstall();
   }
  )

  var AUTO_UPDATE_URL = UPDATE_SERVER_URL + '?version=' + app.getVersion()

  //  If platform is Windows, use S3 file server instead of update server.
  //  please see /docs/windows_updating.txt for more information
  if (process.platform === 'win32') {
    AUTO_UPDATE_URL = 'https://s3.amazonaws.com/ot-app-win-updates-2/'
  }
  autoUpdater.setFeedURL(AUTO_UPDATE_URL)
  mainLogger.info('Setting AUTO UPDATE URL to ' + AUTO_UPDATE_URL)
  if (getSetting("autoUpdate")) {
    mainLogger.info('Auto updating is enabled, checking for updates')
    autoUpdater.checkForUpdates()
  } else {
    mainLogger.info('Auto updating disabled in settings, skipping checkForUpdates')
  }
}

module.exports = {
    initAutoUpdater
};
