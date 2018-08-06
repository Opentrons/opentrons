// mock bonjour module
'use strict'

const EventEmitter = require('events')

const __mockBrowser = Object.assign(new EventEmitter(), {
  services: [],
  start: jest.fn(),
  stop: jest.fn(),
  update: jest.fn()
})

const find = jest.fn()

const MockBonjour = jest.fn(() => ({find, __mockBrowser}))

module.exports = MockBonjour

module.exports.__mockReset = function mockBonjourReset () {
  find.mockReset()
  __mockBrowser.start.mockReset()
  __mockBrowser.stop.mockReset()
  __mockBrowser.update.mockReset()
  __mockBrowser.removeAllListeners()

  find.mockReturnValue(__mockBrowser)
}

module.exports.__mockReset()
