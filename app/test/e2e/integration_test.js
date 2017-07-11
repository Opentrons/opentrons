/* global describe, it, beforeEach, afterEach */
import 'babel-polyfill'
import { Application } from 'spectron'
import electronPath from 'electron'
import { expect } from 'chai'
import path from 'path'
import childProcess from 'child_process'
import fs from 'fs'
import shell from 'shelljs'

const delay = time => new Promise(resolve => setTimeout(resolve, time))
const connectDropDown = '//*[@id="connections"]'

let logDir = path.join(__dirname, 'log')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)

const pythonVersion = shell.cat('.python-version').trim()
const python = shell.exec('python --version', {silent: true})
const version = python.stdout || python.stderr || ''

// Needed for Jupyter testing and potentially for future tests 
// involving python interpreter
if (version.indexOf(pythonVersion) === -1) {
  console.log(`e2e tests require Python ${pythonVersion}. Output: ${version || 'none'}`)
  process.exit(1)
}

describe('OT-app', function spec() {
  beforeEach(async () => {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..', '..')],
      chromeDriverLogPath: path.join(logDir, 'chrome-driver.log'),
      webdriverLogPath: path.join(logDir, 'web-driver.log')
    })
    return this.app.start()
  })

  afterEach(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('opens a window', async () => {
    const { client, browserWindow } = this.app
    await client.waitUntilWindowLoaded()
    expect(await client.getWindowCount()).to.equal(1)
    expect(await browserWindow.isMinimized()).to.be.false
    expect(await browserWindow.isDevToolsOpened()).to.be.false
    expect(await browserWindow.isVisible()).be.true
    expect(await browserWindow.isFocused()).be.true
    expect(await browserWindow.getBounds()).have.property('width').and.be.above(0)
    expect(await browserWindow.getBounds()).have.property('height').and.be.above(0)
  })

  var connectAndRunLoadedProtocol = (client) => {
    let pauseTime = process.env.PAUSE_TIME || 500
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

    return client
      .click(connectDropDown)
      .pause(pauseTime)
      .click(virtualSmoothie)
      .pause(pauseTime)
      .waitForExist(saveButton).click(saveButton)
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

  const uploadProtocol = (client, file) => {
    let uploadXpath = '/html/body/div/section/span/form/div/input'
    client.chooseFile(uploadXpath, file)
  }

  it('runs a user uploaded protocol', async () => {
    let file = path.join(__dirname, '..', '..', '..', 'api', 'opentrons', 'server', 'tests', 'data', '/simple_protocol.py')
    console.log('uploading file: ' + file)

    const { client } = this.app
    client.execute(() => {
      window.confirm = function () { return true }
    })

    await client.waitUntilWindowLoaded()
    await uploadProtocol(client, file)
    await connectAndRunLoadedProtocol(client)
    return client.waitForText('.toast-message-text', 'Successfully uploaded simple_protocol.py')
  })

  it('opens login dialog when login is clicked', async () => {
    const { client } = this.app
    await client.waitUntilWindowLoaded()
    await delay(100)
    await client.click('//*[@id="login"]')
    return client.waitForExist('//*[@id="auth0-lock-container-1"]/div/div[2]/form')
  })
})
