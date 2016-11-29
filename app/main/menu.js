module.exports.addMenu = addMenu

const path = require('path')

const electron = require('electron')
const {app, dialog, Menu, shell} = electron
const moment = require('moment-timezone')
const zipFolder = require('zip-folder')

const {getSetting, toggleSetting} = require('./preferences')

function addMenu () {
  const template = [{
    label: 'Opentrons',
    submenu: [
      { label: 'About', selector: 'orderFrontStandardAboutPanel:' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit() } }
    ]},
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Download Logs',
          click () { downloadLogs() }
        },
        {
          label: 'Open Containers Folder',
          click () { openContainersFolder() }
        },
        {
          label: 'Enable Auto Updating this App',
          type: 'checkbox',
          checked: getSetting('autoUpdate'),
          click () { toggleSetting('autoUpdate') }
        },
        {
          label: 'Enable Anonymous Crash Reporting',
          type: 'checkbox',
          checked: getSetting('crashReport'),
          click () { toggleSetting('crashReport') }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open API Documentation',
          click () { electron.shell.openExternal('http://docs.opentrons.com') }
        },
        {
          label: 'Open Getting Started',
          click () { electron.shell.openExternal('https://opentrons.com/getting-started') }
        },
        {
          label: 'Log an Issue',
          click () { electron.shell.openExternal('https://github.com/OpenTrons/opentrons-app/issues/new') }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function downloadLogs () {
  selectDirectory((folder) => {
    if (folder) {
      const timeStamp = moment().tz('America/New_York').format()
      const destination = path.join(folder[0], `otone-data-${timeStamp}.zip`)
      zip(process.env.APP_DATA_DIR, destination)
    };
  })
}

function openContainersFolder () {
  const containersFolderDir = path.join(process.env.APP_DATA_DIR, 'containers')
  shell.openItem(containersFolderDir)
}

function zip (source, destination) {
  zipFolder(source, destination, function (err) {
    if (err) {
      dialog.showMessageBox({
        message: `Log exporting failed with error: \n\n ${err}`,
        buttons: ['OK']
      })
    } else {
      dialog.showMessageBox({
        message: `Logs successfully exported to ${destination}`,
        buttons: ['OK']
      })
    }
  })
}

function selectDirectory (callback) {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, callback)
}
