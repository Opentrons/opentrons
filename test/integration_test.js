var Application = require('spectron').Application
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var path = require('path')
var glob = require("glob")


var isWin = /^win/.test(process.platform);
var appExecutablePath = 'dist/mac/OpenTrons.app/Contents/MacOS/OpenTrons'
if (isWin) {
  var detectedExes = glob.sync('releases\\*.exe');
  appExecutablePath = detectedExes[0];
  console.log('App exes on windows', detectedExes, appExecutablePath)
}
process.env.DEBUG = 'true'


chai.should()
chai.use(chaiAsPromised)

describe('application launch', function () {
  beforeEach(function () {
    this.app = new Application({
      path: appExecutablePath
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
      .click('.next')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
      .click('.next')
      .pause(pauseTime)
  })
})
