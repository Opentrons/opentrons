if (require('electron-squirrel-startup')) return
const child_process = require('child_process')
const fs = require('fs')
const http = require('http')
const path = require('path')
const urlJoin = require('url-join')

const electron = require('electron')
const rp = require('request-promise')
const {app, BrowserWindow} = electron

const {addMenu} = require('./menu.js')
const {getLogger} = require('./logging.js')
const {initAutoUpdater} = require('./updater.js')
const {ServerManager} = require('./servermanager.js')
const {PythonEnvManager} = require('./envmanager.js')
const {waitUntilServerResponds} = require('./util.js')

let serverManager = new ServerManager()
let pythonEnvManager = new PythonEnvManager()
let mainWindow
let pyRunProcess

console.log('before', process.env.STATIC_ASSETS_BASE_URL, process.env.STATIC_ASSETS_BRANCH)
const STATIC_ASSETS_BASE_URL = process.env.STATIC_ASSETS_BASE_URL || 'https://s3.amazonaws.com/ot-app-builds/assets/'
const STATIC_ASSETS_BRANCH = process.env.STATIC_ASSETS_BRANCH || 'stable'
const STATIC_ASSETS_URL = urlJoin(STATIC_ASSETS_BASE_URL, STATIC_ASSETS_BRANCH)

console.log(STATIC_ASSETS_BASE_URL, STATIC_ASSETS_BRANCH, STATIC_ASSETS_URL)


if (process.env.NODE_ENV === 'development'){
  require('electron-debug')({showDevTools: 'undocked'});
}

function createWindow (windowUrl) {
  mainWindow = new BrowserWindow({width: 1060, height: 750})
  mainWindow.loadURL(windowUrl)
  mainWindow.on('closed', function () {
    mainWindow = null
    app.quit()
  })
}

function createAndSetAppDataDir () {
  if (!app.isReady()) {
    throw Error('Attempting to create otone_data dir when app is not ready')
  }
  const appDataDir = path.join(app.getPath('userData'), 'otone_data')

  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir)
  }
  process.env['APP_DATA_DIR'] = appDataDir
}

function spawnProcess(cp, file, args, options) {
  cp = child_process.spawn(file, args, options)
  cp.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  cp.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
  cp.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

app.on('python-env-ready', function () {
  console.log('Run pip update')
  let envLoc = pythonEnvManager.getEnvAppDataDirPath()
  let pyRunScript = path.join(envLoc, 'pyrun.sh')
  let wheelNameFile = urlJoin(STATIC_ASSETS_URL, 'whl-name')
  console.log('wheel name file', wheelNameFile)

  rp(wheelNameFile).then(wheelName => {
    console.log(`Found: "${wheelName}"`)
    let wheelNameURIEncoded = encodeURIComponent(wheelName.trim())
    spawnProcess(pyRunProcess, pyRunScript, [urlJoin(STATIC_ASSETS_URL, wheelNameURIEncoded)], {cwd: envLoc})
  })
})


function startUp () {
  // Prepare app data dir (necessary for logging errors that occur during setup)
  createAndSetAppDataDir()

  const mainLogger = getLogger('electron-main')
  process.on('uncaughtException', (error) => {
    if (process.listeners('uncaughtException').length > 1) {
      console.log(error)
      mainLogger.info(error)
    }
  })
  if (process.env.NODE_ENV === 'development') {
    require('vue-devtools').install()
  }

  // Startup Actions
  pythonEnvManager.setupEnvironment()
  // serverManager.start()
  let _createWindow = () => {
    return createWindow(urlJoin(STATIC_ASSETS_URL, 'index.html'))
  }
  waitUntilServerResponds(_createWindow, 'http://localhost:31950/robot/serial/list')
  addMenu()
  initAutoUpdater()
}

app.on('ready', startUp)

app.on('quit', function () {
  serverManager.shutdown()
  child_process.spawnSync(
    'pkill',
    ['-9', path.basename(pyRunProcess.serverProcess.spawnfile)]
  )
})
