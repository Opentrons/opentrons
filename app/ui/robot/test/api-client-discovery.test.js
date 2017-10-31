// test the MDNS discovery mechanisms of the API client
import Bonjour from 'bonjour'
import EventEmitter from 'events'

import {delay as _delay} from '../../util'
import client from '../api-client/client'
import {actions} from '../'

jest.mock('bonjour')
jest.useFakeTimers()

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

  beforeEach(() => {
    // mock mdns browser
    browser = new EventEmitter()
    browser.stop = jest.fn()

    bonjour = {find: jest.fn(() => browser)}
    Bonjour.mockReturnValue(bonjour)

    dispatch = jest.fn()
    const _receive = client(dispatch)

    sendToClient = (state, action) => {
      _receive(state, action)
      return delay(1)
    }
  })

  // TODO(mc, 2017-10-30): change type to http when API advertises correctly
  test('searches for SSH services', () => {
    return sendToClient({}, actions.discover())
      .then(() => expect(bonjour.find).toHaveBeenCalledWith({type: 'ssh'}))
  })

  test('sets a 30 second discovery timeout', () => {
    const expectedFinish = actions.discoverFinish()

    return sendToClient({}, actions.discover())
      .then(() => jest.runTimersToTime(30000))
      .then(() => {
        expect(browser.stop).toHaveBeenCalled()
        expect(dispatch).toHaveBeenCalledWith(expectedFinish)
      })
  })

  test('dispatches ADD_DISCOVEREDs on new services', () => {
    // TODO(mc, 2017-10-30): change type to http when API advertises correctly
    const services = [
      {name: 'ot-1', host: 'ot-1.local', port: '31950', type: 'ssh'},
      {name: 'ot-2', host: 'ot-2.local', port: '31950', type: 'ssh'},
      {name: 'ot-3', host: 'ot-3.local', port: '31950', type: 'ssh'}
    ]

    return sendToClient({}, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => services.forEach((s) => {
        expect(dispatch).toHaveBeenCalledWith(actions.addDiscovered(s.host))
      }))
  })

  test('dispatches REMOVE_DISCOVEREDs on service downs', () => {
    // TODO(mc, 2017-10-30): change type to http when API advertises correctly
    const services = [
      {name: 'ot-1', host: 'ot-1.local', port: '31950', type: 'ssh'},
      {name: 'ot-2', host: 'ot-2.local', port: '31950', type: 'ssh'},
      {name: 'ot-3', host: 'ot-3.local', port: '31950', type: 'ssh'}
    ]

    return sendToClient({}, actions.discover())
      .then(() => services.forEach((s) => browser.emit('down', s)))
      .then(() => services.forEach((s) => {
        expect(dispatch).toHaveBeenCalledWith(actions.removeDiscovered(s.host))
      }))
  })

  test('will not dispatch ADD_DISCOVERED after discovery period', () => {
    return sendToClient({}, actions.discover())
      .then(() => jest.runTimersToTime(30000))
      .then(() => browser.emit('up', {
        name: 'ot-1',
        host: 'ot-1.local',
        port: '31950',
        type: 'ssh'
      }))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.addDiscovered(expect.anything())
      ))
  })

  test('will not dispatch REMOVE_DISCOVERED after discovery period', () => {
    return sendToClient({}, actions.discover())
      .then(() => jest.runTimersToTime(30000))
      .then(() => browser.emit('down', {
        name: 'ot-1',
        host: 'ot-1.local',
        port: '31950',
        type: 'ssh'
      }))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.removeDiscovered(expect.anything())
      ))
  })

  test('only dispatches for hosts with "ot" in the name', () => {
    const services = [
      {name: 'ot-1', host: 'ot-1.local', port: '31950', type: 'ssh'},
      {name: 'nope', host: 'nope.local', port: '31950', type: 'ssh'},
      {name: 'ot-3', host: 'ot-3.local', port: '31950', type: 'ssh'}
    ]

    return sendToClient({}, actions.discover())
      .then(() => services.forEach((s) => browser.emit('up', s)))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.addDiscovered('nope.local')
      ))
      .then(() => services.forEach((s) => browser.emit('down', s)))
      .then(() => expect(dispatch).not.toHaveBeenCalledWith(
        actions.removeDiscovered('nope.local')
      ))
  })
})
