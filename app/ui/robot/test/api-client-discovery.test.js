// test the MDNS discovery mechanisms of the API client
import Bonjour from 'bonjour'
import EventEmitter from 'events'

import {delay as _delay} from '../../util'
import client from '../api-client/client'
import {actions} from '../'

jest.mock('bonjour')
jest.useFakeTimers()

const EXPECTED_DISCOVERY_MS = 30000

// custom delay function to deal with fake timers
const delay = (time) => {
  const wait = _delay(time)
  // TODO(mc, 2017-10-30): jest v21 renamed this method advanceTimersByTime
  jest.runTimersToTime(time)
  return wait
}

describe('api client - discovery', () => {
  let bonjour
  let browser
  let dispatch
  let sendToClient
  let _oldFetch

  beforeAll(() => {
    // mock fetch
    _oldFetch = global.fetch
    global.fetch = jest.fn(() => Promise.resolve({ok: false}))
  })

  afterAll(() => {
    global.fetch = _oldFetch
  })

  beforeEach(() => {
    // mock mdns browser
    browser = new EventEmitter()
    browser.stop = jest.fn()

    bonjour = {find: jest.fn(() => browser)}
    Bonjour.mockReturnValue(bonjour)

    global.fetch.mockClear()

    dispatch = jest.fn()
    const _receive = client(dispatch)

    sendToClient = (state, action) => {
      _receive(state, action)
      return delay(1)
    }
  })

  afterEach(() => delay(EXPECTED_DISCOVERY_MS))

  test('searches for SSH services', () => {
    return sendToClient({}, actions.discover())
      .then(() => expect(bonjour.find).toHaveBeenCalledWith({type: 'http'}))
  })

  test('sets a 30 second discovery timeout', () => {
    const expectedFinish = actions.discoverFinish()

    return sendToClient({}, actions.discover())
      .then(() => jest.runTimersToTime(EXPECTED_DISCOVERY_MS))
      .then(() => {
        expect(browser.stop).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(expectedFinish)
      })
  })

  test('dispatches ADD_DISCOVEREDs on new services', () => {
    const services = [
      {name: 'opentrons-1', host: 'ot-1.local', port: '31950', type: 'http'},
      {name: 'opentrons-2', host: 'ot-2.local', port: '31950', type: 'http'},
      {name: 'opentrons-3', host: 'ot-3.local', port: '31950', type: 'http'}
    ]

    return sendToClient({}, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => services.forEach((s) => {
        expect(dispatch).toHaveBeenCalledWith(actions.addDiscovered(s))
      }))
  })

  test('dispatches REMOVE_DISCOVEREDs on service downs', () => {
    const services = [
      {name: 'opentrons-1', host: 'ot-1.local', port: '31950', type: 'http'},
      {name: 'opentrons-2', host: 'ot-2.local', port: '31950', type: 'http'},
      {name: 'opentrons-3', host: 'ot-3.local', port: '31950', type: 'http'}
    ]

    return sendToClient({}, actions.discover())
      .then(() => services.forEach((s) => browser.emit('down', s)))
      .then(() => services.forEach((s) => {
        expect(dispatch)
          .toHaveBeenCalledWith(actions.removeDiscovered(s.host))
      }))
  })

  test('will not dispatch ADD_DISCOVERED after discovery period', () => {
    return sendToClient({}, actions.discover())
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
    return sendToClient({}, actions.discover())
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

  test('only dispatches for hosts with "ot" in the name', () => {
    const services = [
      {name: 'opentrons-1', host: 'ot-1.local', port: '31950', type: 'http'},
      {name: 'nope', host: 'nope.local', port: '31950', type: 'http'},
      {name: 'opentrons-3', host: 'ot-3.local', port: '31950', type: 'http'}
    ]

    return sendToClient({}, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.addDiscovered({host: 'nope.local'})
      ))
      .then(() => services.forEach((s) => browser.emit('down', s)))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.removeDiscovered('nope.local')
      ))
  })

  test('polls directly connected host every second and adds it', () => {
    const expectedEndpoint = 'http://[fd00:0:cafe:fefe::1]:31950/health'
    const expectedDispatch = actions.addDiscovered({
      name: 'Opentrons USB',
      host: '[fd00:0:cafe:fefe::1]',
      port: 31950
    })

    global.fetch.mockReturnValue(Promise.resolve({ok: true}))

    return sendToClient({}, actions.discover())
      .then(() => delay(EXPECTED_DISCOVERY_MS))
      .then(() => {
        expect(global.fetch).toHaveBeenCalledTimes(30)
        expect(global.fetch).toHaveBeenCalledWith(expectedEndpoint)
      })
      .then(() => expect(dispatch).toHaveBeenCalledWith(expectedDispatch))
  })

  test('does not add a direct service if fetch fails', () => {
    global.fetch.mockReturnValue(Promise.resolve({ok: false}))

    return sendToClient({}, actions.discover())
      .then(() => delay(1000))
      .then(() => expect(global.fetch).toHaveBeenCalled())
      .then(() => expect(dispatch).not.toHaveBeenCalled())
  })

  test('does not add a direct service if fetch errors', () => {
    global.fetch.mockReturnValue(Promise.reject(new Error('network error')))

    return sendToClient({}, actions.discover())
      .then(() => delay(1000))
      .then(() => expect(global.fetch).toHaveBeenCalled())
      .then(() => expect(dispatch).not.toHaveBeenCalled())
  })
})
