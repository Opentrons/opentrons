const electron = require("electron");
const {app, dialog, autoUpdater} = electron;
const {getSetting} = require('./preferences')
const {getLogger} = require('./logging.js')

var UPDATE_SERVER_URL =  'http://ot-app-releases-2.herokuapp.com';


function initAutoUpdater () {
  const mainLogger = getLogger('electron-main')

  autoUpdater.on(
    'error',
    (err) => mainLogger.log(`Update error: ${err.message}`)
  )

  autoUpdater.on(
    'checking-for-update',
    () => mainLogger.log('Checking for update')
  )

  autoUpdater.on(
    'update-available',
    () => mainLogger.log('Update available')
  )

  autoUpdater.on(
    'update-not-available',
    () => mainLogger.log('Update not available')
  )

  autoUpdater.on(
    'update-downloaded',
   function(e, releaseNotes, releaseName, date, url) {
       mainLogger.log(`Update downloaded: ${releaseName}: ${url}`)
       mainLogger.log(`Update Info: ${releaseNotes}`)

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
    AUTO_UPDATE_URL = 'https://s3-us-west-2.amazonaws.com/ot-app-win-updates/'
  }
  if (getSetting("autoUpdate")) {
    mainLogger.log('Setting AUTO UPDATE URL to ' + AUTO_UPDATE_URL)
    autoUpdater.setFeedURL(AUTO_UPDATE_URL)

    mainLogger.log('Auto updating is enabled, checking for updates')
    autoUpdater.checkForUpdates()
  }
}

module.exports = {
    initAutoUpdater
};
