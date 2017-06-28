const electron = require('electron')
const {dialog} = electron
const settings = require('electron-settings')

settings.on('create', pathToSettings => {
  // A dialog popping up is preventing 
  // integration tests from running
  if (process.env.INTEGRATION_TEST === 'true') {
    settings.setSync('autoUpdate', false)
    return
  }

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

function getSetting (setting) {
  return settings.getSync(setting)
}

function toggleSetting (setting) {
  settings.setSync(setting, !getSetting(setting))
}

module.exports = {
  getSetting,
  toggleSetting
}
