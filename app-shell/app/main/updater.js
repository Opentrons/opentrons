const electron = require('electron')
const {app, dialog} = electron
const {autoUpdater} = require('electron-updater')
const {getSetting} = require('./preferences')
const {getLogger} = require('./logging.js')

autoUpdater.allowDowngrade = true

let channel = getSetting('useBetaApp') ? 'beta' : 'release'

function initAutoUpdater () {
  // Log whats happening
  const log = require('electron-log')
  log.transports.file.level = 'info'
  autoUpdater.logger = log

  const mainLogger = getLogger('electron-main')
  mainLogger.info('starting ')

  autoUpdater.on(
    'error',
    (err) => mainLogger.info(`Update error: ${err.message}`)
  )

  // TODO: Remove me?
  // autoUpdater.on('download-progress', (progressObj) => {
  //   let log_message = "Download speed: " + progressObj.bytesPerSecond
  //   log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  //   log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
  //   console.log(log_message);
  // })

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
   function (e, releaseNotes, releaseName, date, url) {
     mainLogger.info(`Update downloaded: ${releaseName}: ${url}`)
     mainLogger.info(`Update Info: ${releaseNotes}`)

     var index = dialog.showMessageBox({
       type: 'info',
       buttons: ['Restart', 'Later'],
       title: 'OT App', // TODO: Make this a config
       message: 'The new version has been downloaded. Please restart the application to apply the updates.',
       detail: releaseName + '\n\n' + releaseNotes
     })

     if (index === 1) {
       return
     }

     autoUpdater.quitAndInstall()
   }
  )

  autoUpdater.setFeedURL({
    provider: 's3',
    bucket: 'ot-app-builds',
    path: `test/${os}/${channel}`,
    channel: channel
  })

  if (getSetting('autoUpdate')) {
    mainLogger.info('Auto updating is enabled, checking for updates')
    autoUpdater.checkForUpdates()
  } else {
    mainLogger.info('Auto updating disabled in settings, skipping checkForUpdates')
  }
}

module.exports = {
  initAutoUpdater
}
