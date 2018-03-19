// electron main entry point
'use strict'

const path = require('path')
const url = require('url')
const {app, dialog, Menu, BrowserWindow} = require('electron')
const log = require('electron-log')

const initializeMenu = require('./menu')
const {initialize: initializeApiUpdate} = require('./api-update')

// TODO(mc, 2018-01-06): replace dev and debug vars with feature vars
const DEV_MODE = process.env.NODE_ENV === 'development'
const DEBUG_MODE = process.env.DEBUG

if (DEV_MODE || DEBUG_MODE) {
  require('electron-debug')({showDevTools: true})
}

const appUrl = DEV_MODE
  ? `http://localhost:${process.env.PORT}`
  : url.resolve('file://', path.join(__dirname, '../ui/index.html'))

// hold on to a reference to ensure mainWindow isn't GC'd
let mainWindow

app.on('ready', startUp)

function startUp () {
  log.info('Starting App')
  process.on('uncaughtException', (error) => log.info('Uncaught: ', error))

  createWindow()
  initializeMenu()
  initializeApiUpdate()
    .catch((e) => console.error('Initialze API update module error', e))

  load()

  if (DEV_MODE || DEBUG_MODE) {
    installAndOpenExtensions()
      .catch((error) => dialog.showErrorBox('Error opening dev tools', error))
  }
}

function createWindow () {
  mainWindow = new BrowserWindow({
    show: false,
    useContentSize: true,
    width: 1024,
    height: 768,
    webPreferences: {
      experimentalFeatures: true,
      devTools: DEV_MODE || DEBUG_MODE,

      // node integration needed for mdns robot discovery in webworker
      nodeIntegrationInWorker: true,

      // TODO(mc, 2018-02-12): this works around CORS restrictions
      //   while in dev mode; evaluate whether this is acceptable
      webSecurity: !DEV_MODE
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  return mainWindow
}

function load () {
  log.info('Loading App UI at ' + appUrl)
  mainWindow.loadURL(appUrl, {'extraHeaders': 'pragma: no-cache\n'})
  log.info('App UI loaded')
}

function installAndOpenExtensions () {
  const devtools = require('electron-devtools-installer')
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS
  const install = devtools.default
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ]

  return Promise
    .all(extensions.map((name) => install(devtools[name], forceDownload)))
    .then(() => mainWindow.webContents.on('context-menu', (_, props) => {
      const {x, y} = props

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => mainWindow.inspectElement(x, y)
        }])
        .popup(mainWindow)
    }))
}
