const electron = require("electron");
const {app, dialog, autoUpdater} = electron;
const {toggleSetting, getSetting} = require('./preferences')
var UPDATE_SERVER_URL =  'http://ot-app-releases.herokuapp.com';


function initAutoUpdater () {
  autoUpdater.on(
    'error',
    (err) => console.log(`Update error: ${err.message}`)
  )

  autoUpdater.on(
    'checking-for-update',
    () => console.log('Checking for update')
  )

  autoUpdater.on(
    'update-available',
    () => console.log('Update available')
  )

  autoUpdater.on(
    'update-not-available',
    () => console.log('Update not available')
  )

  autoUpdater.on(
    'update-downloaded',
   function(e, releaseNotes, releaseName, date, url) {
       console.log(`Update downloaded: ${releaseName}: ${url}`)
       console.log(`Update Info: ${releaseNotes}`)

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
  console.log('Setting AUTO UPDATE URL to ' + AUTO_UPDATE_URL)
  autoUpdater.setFeedURL(AUTO_UPDATE_URL)
  if (getSetting("autoUpdate")) autoUpdater.checkForUpdates()
}

module.exports = {
    initAutoUpdater
};
