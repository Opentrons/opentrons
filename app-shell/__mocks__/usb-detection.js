'use strict'

const EventEmitter = require('events')
const detector = new EventEmitter()

detector.startMonitoring = jest.fn()
detector.stopMonitoring = jest.fn()
detector.find = jest.fn()

afterEach(() => {
  detector.removeAllListeners()
})

module.exports = detector
