const electron = require('electron')
const {dialog} = electron
const settings = require('electron-settings')

const {autoUpdater} = require('electron-updater')
const {getLogger} = require('./logging.js')

settings.on('create', pathToSettings => {
  const result = dialog.showMessageBox({
    message: 'Do you want to turn on auto updating?',
    buttons: ['Yes', 'No']
  })

  if (result === 0) {
    settings.setSync('autoUpdate', true)
  } else if (result === 1) {
    settings.setSync('autoUpdate', false)
  }
})

function getChannel() {
  return getSetting('useBetaApp') ? 'beta' : 'stable'
}

function getSetting (setting) {
  return settings.getSync(setting)
}

function toggleSetting (setting) {
  const mainLogger = getLogger('electron-main')
  mainLogger.info(`[Preferences] toggling setting: ${setting}`)
  settings.setSync(setting, !getSetting(setting))

  switch (setting) {
    case "useBetaApp":
      autoUpdater.emit('channel-changed')
      break
  }
}

module.exports = {
  getChannel,
  getSetting,
  toggleSetting
}
