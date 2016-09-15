const http = require('http')
const child_process = require('child_process')
const electron = require('electron')
const {app, BrowserWindow} = electron

const {ServerManager} = require('./servermanager.js')


let serverManager = new ServerManager()
let mainWindow


function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 900})
  mainWindow.loadURL("http://127.0.0.1:5000/welcome/connect")

  mainWindow.on('closed', function () {
    mainWindow = null
    app.quit();
  })
}

app.on('ready', () => {serverManager.start(); setTimeout(createWindow, 2000)})

app.on('quit', function(){
    serverManager.shutdown();
});
