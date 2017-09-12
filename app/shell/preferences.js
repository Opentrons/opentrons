'use strict'

const {dialog} = require('electron')
const settings = require('electron-settings')

// TODO(mc, 2017-09-12): don't use sync methods
settings.on('create', (pathToSettings) => {
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
  // TODO(mc, 2017-09-12): don't use sync methods
  return settings.getSync(setting)
}

function toggleSetting (setting) {
  // TODO(mc, 2017-09-12): don't use sync methods
  settings.setSync(setting, !getSetting(setting))
}

module.exports = {getSetting, toggleSetting}
