// test the MDNS discovery mechanisms of the API client
import Bonjour from 'bonjour'
import EventEmitter from 'events'

import {delay as _delay} from '../../util'
import {fetchHealth, __mockThunk} from '../../http-api-client/health'
import client from '../api-client/client'
import {actions} from '../'

jest.mock('bonjour')
jest.mock('../../http-api-client/health')

jest.useFakeTimers()

const EXPECTED_DISCOVERY_MS = 30000

// custom delay function to deal with fake timers
const delay = (time) => {
  const wait = _delay(time)
  // TODO(mc, 2017-10-30): jest v21 renamed this method advanceTimersByTime
  jest.runTimersToTime(time)
  return wait
}

const notScanningState = {
  robot: {
    connection: {
      isScanning: false
    }
  }
}

describe('api client - discovery', () => {
  let bonjour
  let browser
  let dispatch
  let sendToClient

  beforeEach(() => {
    // mock mdns browser
    browser = new EventEmitter()
    browser.stop = jest.fn()

    bonjour = {find: jest.fn(() => browser)}
    Bonjour.mockReturnValue(bonjour)

    fetchHealth.mockClear()
    __mockThunk.mockClear()

    dispatch = jest.fn()
    const _receive = client(dispatch)

    sendToClient = (state, action) => {
      _receive(state, action)
      return delay(1)
    }
  })

  afterEach(() => delay(EXPECTED_DISCOVERY_MS))

  test('searches for HTTP services', () => {
    return sendToClient(notScanningState, actions.discover())
      .then(() => expect(bonjour.find).toHaveBeenCalledWith({type: 'http'}))
  })

  test('sets a 30 second discovery timeout', () => {
    const expectedFinish = actions.discoverFinish()

    return sendToClient(notScanningState, actions.discover())
      .then(() => jest.runTimersToTime(EXPECTED_DISCOVERY_MS))
      .then(() => {
        expect(browser.stop).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(expectedFinish)
      })
  })

  test('dispatches ADD_DISCOVEREDs on new services', () => {
    const services = [
      {name: 'opentrons-1', port: '31950', addresses: ['192.168.1.1']},
      {name: 'opentrons-2', port: '31950', addresses: ['192.168.1.2']},
      {name: 'opentrons-3', port: '31950', addresses: ['192.168.1.3']}
    ]

    return sendToClient(notScanningState, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => services.forEach((s) => {
        const robot = Object.assign({}, s, {ip: s.addresses[0]})
        expect(dispatch).toHaveBeenCalledWith(actions.addDiscovered(robot))
      }))
  })

  test('dispatches fetchHealth on new services', () => {
    const services = [
      {name: 'opentrons-1', port: '31950', addresses: ['192.168.1.1']},
      {name: 'opentrons-2', port: '31950', addresses: ['192.168.1.2']},
      {name: 'opentrons-3', port: '31950', addresses: ['192.168.1.3']}
    ]

    return sendToClient(notScanningState, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => services.forEach((s) => {
        const robot = Object.assign({}, s, {ip: s.addresses[0]})
        expect(fetchHealth).toHaveBeenCalledWith(robot)
        expect(__mockThunk).toHaveBeenCalledWith(dispatch)
      }))
  })

  test('dispatches REMOVE_DISCOVEREDs on service downs', () => {
    const services = [
      {name: 'opentrons-1', host: 'ot-1.local', port: '31950', type: 'http'},
      {name: 'opentrons-2', host: 'ot-2.local', port: '31950', type: 'http'},
      {name: 'opentrons-3', host: 'ot-3.local', port: '31950', type: 'http'}
    ]

    return sendToClient(notScanningState, actions.discover())
      .then(() => services.forEach((s) => browser.emit('down', s)))
      .then(() => services.forEach((s) => {
        expect(dispatch)
          .toHaveBeenCalledWith(actions.removeDiscovered(s))
      }))
  })

  test('will not dispatch ADD_DISCOVERED after discovery period', () => {
    return sendToClient(notScanningState, actions.discover())
      .then(() => jest.runTimersToTime(EXPECTED_DISCOVERY_MS))
      .then(() => browser.emit('up', {
        name: 'opentrons-1',
        host: 'ot-1.local',
        port: '31950',
        type: 'http'
      }))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.addDiscovered(expect.anything())
      ))
  })

  test('will not dispatch REMOVE_DISCOVERED after discovery period', () => {
    return sendToClient(notScanningState, actions.discover())
      .then(() => jest.runTimersToTime(EXPECTED_DISCOVERY_MS))
      .then(() => browser.emit('down', {
        name: 'opentrons-1',
        host: 'ot-1.local',
        port: '31950',
        type: 'http'
      }))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.removeDiscovered(expect.anything())
      ))
  })

  test('only dispatches for hosts with "opentrons" in the name', () => {
    const services = [
      {name: 'opentrons-1', host: 'ot-1.local', port: '31950', type: 'http'},
      {name: 'nope', host: 'nope.local', port: '31950', type: 'http'},
      {name: 'opentrons-3', host: 'ot-3.local', port: '31950', type: 'http'}
    ]

    return sendToClient(notScanningState, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.addDiscovered(services[1])
      ))
      .then(() => services.forEach((s) => browser.emit('down', s)))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.removeDiscovered(services[1])
      ))
  })

  test('dispatches fetchHealth for wired host every second', () => {
    const expectedRobot = {
      name: 'Opentrons USB',
      ip: '[fd00:0:cafe:fefe::1]',
      port: 31950,
      wired: true
    }

    return sendToClient(notScanningState, actions.discover())
      .then(() => delay(EXPECTED_DISCOVERY_MS))
      .then(() => {
        expect(fetchHealth).toHaveBeenCalledTimes(30)
        expect(fetchHealth).toHaveBeenCalledWith(expectedRobot)
        expect(__mockThunk).toHaveBeenCalledTimes(30)
        expect(__mockThunk).toHaveBeenCalledWith(dispatch)
      })
  })

  test('does not start new discovery if already in progress', () => {
    const state = {robot: {connection: {isScanning: true}}}

    return sendToClient(state, actions.discover())
      .then(() => delay(EXPECTED_DISCOVERY_MS))
      .then(() => expect(bonjour.find).not.toHaveBeenCalled())
      .then(() => expect(fetchHealth).not.toHaveBeenCalled())
  })
})
