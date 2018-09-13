// mock for mdns-js
'use strict'

const EventEmitter = require('events')

const __mockBrowser = Object.assign(new EventEmitter(), {
  discover: jest.fn(),
  stop: jest.fn(),
})

const createBrowser = jest.fn()

const tcp = name => ({name, protocol: 'tcp', subtypes: [], description: ''})

const __mockReset = () => {
  createBrowser.mockReset()
  __mockBrowser.removeAllListeners()
  __mockBrowser.discover.mockReset()
  __mockBrowser.stop.mockReset()
  createBrowser.mockReturnValue(__mockBrowser)
}

module.exports = {tcp, createBrowser, __mockBrowser, __mockReset}
