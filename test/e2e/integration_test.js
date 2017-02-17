/* global describe, it, beforeEach, afterEach */
let Application = require('spectron').Application
let chai = require('chai')
const { expect } = chai
let chaiAsPromised = require('chai-as-promised')
let path = require('path')
let child_process = require('child_process')

let appPath
if (process.platform === 'win32') {
  appPath = path.resolve(
    __dirname,
    '../../node_modules/electron/dist/Electron.exe'
  )
} else if (process.platform === 'darwin') {
  appPath = path.resolve(
    __dirname,
    '../../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
  )
} else {
  appPath = path.resolve(
    __dirname,
    '../../node_modules/electron/dist/electron'
  )
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

  function assertText(result, expected) {
    expect(result).to.equal(expected)
  }

  it('opens a window', function () {
    return this.app.client.waitUntilWindowLoaded(31950)
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })

  function connectAndRunLoadedProtocol() {
    let pauseTime = process.env.PAUSE_TIME || 0
    let connectDropDown = '//*[@id="connections"]'
    let virtualSmoothie = connectDropDown + '/option[3]'
    let saveButton = '//*[@id="task"]/span/button[1]'
    let platePath = '//*[@id="step-list"]/div/span/div/ul/li[2]/a'
    let plungerPath = '//*[@id="step-list"]/div/span/div/ul/li[3]/a'
    let top = '//*[@id="task-pipette"]/span/div[1]/section[1]/button[1]'
    let bottom = '//*[@id="task-pipette"]/span/div[1]/section[2]/button[1]'
    let dropTip = '//*[@id="task-pipette"]/span/div[1]/section[3]/button[1]'
    let blowOut = '//*[@id="task-pipette"]/span/div[1]/section[4]/button[1]'
    let plungerDown = '//*[@id="jog-controls-plunger"]/span[1]/button[2]'
    let run = '//*[@id="run"]/button'

    return this.app.client
      .click(connectDropDown)
      .pause(pauseTime)
      .click(virtualSmoothie)
      .pause(pauseTime)
      .click(saveButton)
      .pause(pauseTime)
      .click(platePath)
      .pause(pauseTime)
      .click(saveButton)
      .pause(pauseTime)
      .click(plungerPath)
      .pause(pauseTime)
      .click(top)
      .pause(pauseTime)
      .click(plungerDown)
      .pause(pauseTime)
      .click(bottom)
      .pause(pauseTime)
      .click(plungerDown)
      .pause(pauseTime)
      .click(dropTip)
      .pause(pauseTime)
      .click(blowOut)
      .pause(pauseTime)
      .click(run)
      .pause(2000)
      .waitForText('.toast-message-text', 'Run complete')
  }

  function uploadProtocol(file) {
    let uploadXpath = '/html/body/div/section/span/form/div/input'
    return this.app.client
      .chooseFile(uploadXpath, file)
      .pause(1000)
  }

  it('runs a user uploaded protocol', function () {
    let file = path.join(__dirname, '..', '..', 'server', 'tests', 'data', '/simple_protocol.py')

    this.app.client.execute(() => {
      window.confirm = function () { return true }
    })
    return this.app.client.waitUntilWindowLoaded(31950)
      .then(uploadProtocol.bind(this, file))
      .then(connectAndRunLoadedProtocol.bind(this))
      .waitForText('.toast-message-text', 'Successfully uploaded simple_protocol.py')
  })

  it('runs jupyter protocol', function () {
    let uploadScript = path.join(__dirname, 'jupyter_upload.py')
    child_process.spawnSync('python3', [uploadScript])

    this.app.client.execute(() => {
      window.confirm = function () { return true }
    })
    return this.app.client.waitUntilWindowLoaded(31950)
      .then(connectAndRunLoadedProtocol.bind(this))
  })

  it('handles upload of empty protocol gracefully', function () {
    let file = path.join(__dirname, '..', '..', 'server', 'tests', 'data', '/empty.py')
    let expectedText = 'This protocol does not contain any commands for the robot.'
    return this.app.client.waitUntilWindowLoaded(31950)
      .then(uploadProtocol.bind(this, file))
      .getText('.toast-message-text')
      .then(assertText.bind(null, expectedText))
  })
})
