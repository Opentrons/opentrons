var Application = require('spectron').Application
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var path = require('path')
var glob = require("glob")


let appPath;
if (process.platform === 'win32') {
  appPath = path.resolve(
    __dirname,
    '../node_modules/electron-prebuilt/dist/Electron.exe'
  );
} else if (process.platform === 'darwin') {
  appPath = path.resolve(
    __dirname,
    '../node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron'
  );
} else {
  appPath = path.resolve(
    __dirname,
    '../node_modules/electron/dist/electron'
  );
}


chai.should()
chai.use(chaiAsPromised)

describe('application launch', function () {
  beforeEach(function () {
    this.app = new Application({
      path: appPath,
      args: ['./app']
    })
    return this.app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('opens a window', function () {
    return this.app.client.waitUntilWindowLoaded(5000)
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })

  it('runs a protocol', function () {
    var file = path.join(__dirname, '..', 'server', 'tests', 'data', '/protocol.py')
    var pauseTime = process.env.PAUSE_TIME || 0
    var tiprackXpath = "//*[@id='task-pane']/div/section/div/div[2]/div[2]/div[3]/button[1]"
    var plateXpath = "//*[@id='task-pane']/div/section/div/div[2]/div[2]/div[2]/button[1]"
    var top = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/a[1]'
    var topSave = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/button[1]'
    var bottom = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/a[2]'
    var bottomSave = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/button[3]'
    var blowOut = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/a[3]'
    var blowOutSave = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/button[5]'
    var dropTip = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/a[4]'
    var dropTipSave = '//*[@id="task-pane"]/div/section/div/div[3]/div[2]/div[2]/button[7]'

    return this.app.client.waitUntilWindowLoaded(5000)
      .click('//*[@id="connections"]/option[2]')
      .pause(pauseTime)
      .click('.btn-connect')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .chooseFile('//*[@id="task-pane"]/div/section/div[2]/form/div/input', file)
      .pause(1000)
      .click('.next')
      .pause(pauseTime)
      .click(tiprackXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(plateXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(plateXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(plateXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(tiprackXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(plateXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(plateXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(plateXpath)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click(top)
      .click(topSave)
      .click(bottom)
      .click(bottomSave)
      .click(blowOut)
      .click(blowOutSave)
      .click(dropTip)
      .click(dropTipSave)
      .pause(pauseTime)
      .click('.next')
      .click(top)
      .click(topSave)
      .click(bottom)
      .click(bottomSave)
      .click(blowOut)
      .click(blowOutSave)
      .click(dropTip)
      .click(dropTipSave)
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click('//*[@id="task-pane"]/div/section/div[2]/div[2]/button[1]')
      .pause(2000)
      .click('//*[@id="app"]/div[1]/div/div[2]')
  })
})
