// events map tests
import {LOCATION_CHANGE} from 'react-router-redux'

import makeEvent from '../make-event'
import {actions as robotActions} from '../../robot'

describe('analytics events map', () => {
  test('@@router/LOCATION_CHANGE -> url event', () => {
    const state = {}
    // TODO(mc, 2018-05-28): this type has changed since @beta.6
    const action = {type: LOCATION_CHANGE, payload: {pathname: '/foo'}}

    expect(makeEvent(state, action)).toEqual({
      name: 'url',
      properties: {pathname: '/foo'},
    })
  })

  test('robot:CONNECT_RESPONSE -> robotConnected event', () => {
    const state = (name) => ({
      robot: {
        connection: {
          connectRequest: {name},
        },
      },
      discovery: {
        robotsByName: {
          wired: {
            name: 'wired',
            connections: [{ip: 'foo', port: 123, ok: true, local: true}],
          },
          wireless: {
            name: 'wireless',
            connections: [{ip: 'bar', port: 456, ok: true, local: false}],
          },
        },
      },
    })

    const success = robotActions.connectResponse()
    const failure = robotActions.connectResponse(new Error('AH'))

    expect(makeEvent(state('wired'), success)).toEqual({
      name: 'robotConnect',
      properties: {method: 'usb', success: true, error: ''},
    })

    expect(makeEvent(state('wired'), failure)).toEqual({
      name: 'robotConnect',
      properties: {method: 'usb', success: false, error: 'AH'},
    })

    expect(makeEvent(state('wireless'), success)).toEqual({
      name: 'robotConnect',
      properties: {method: 'wifi', success: true, error: ''},
    })

    expect(makeEvent(state('wireless'), failure)).toEqual({
      name: 'robotConnect',
      properties: {method: 'wifi', success: false, error: 'AH'},
    })
  })

  test('robot:SESSION_RESPONSE error -> protocolUpload event', () => {
    const state = {}
    const success = {type: 'robot:SESSION_RESPONSE'}
    const failure = {type: 'robot:SESSION_RESPONSE', error: new Error('AH')}

    expect(makeEvent(state, success)).toEqual({
      name: 'protocolUpload',
      properties: {success: true, error: ''},
    })

    expect(makeEvent(state, failure)).toEqual({
      name: 'protocolUpload',
      properties: {success: false, error: 'AH'},
    })
  })

  test('robot:RUN -> runStart event', () => {
    const state = {}
    const action = {type: 'robot:RUN'}

    expect(makeEvent(state, action)).toEqual({
      name: 'runStart',
      properties: {},
    })
  })

  test('robot:PAUSE_RESPONSE -> runPause event', () => {
    const state = {}
    const success = {type: 'robot:PAUSE_RESPONSE'}
    const failure = {type: 'robot:PAUSE_RESPONSE', error: new Error('AH')}

    expect(makeEvent(state, success)).toEqual({
      name: 'runPause',
      properties: {
        success: true,
        error: '',
      },
    })

    expect(makeEvent(state, failure)).toEqual({
      name: 'runPause',
      properties: {
        success: false,
        error: 'AH',
      },
    })
  })

  test('robot:CANCEL_REPSONSE -> runCancel event', () => {
    const state = {
      robot: {
        session: {
          startTime: 1000,
          runTime: 5000,
        },
      },
    }
    const success = {type: 'robot:CANCEL_RESPONSE'}
    const failure = {type: 'robot:CANCEL_RESPONSE', error: new Error('AH')}

    expect(makeEvent(state, success)).toEqual({
      name: 'runCancel',
      properties: {
        runTime: 4,
        success: true,
        error: '',
      },
    })

    expect(makeEvent(state, failure)).toEqual({
      name: 'runCancel',
      properties: {
        runTime: 4,
        success: false,
        error: 'AH',
      },
    })
  })

  test('robot:RUN_RESPONSE success -> runFinish event', () => {
    const state = {
      robot: {
        session: {
          startTime: 1000,
          runTime: 5000,
        },
      },
    }
    const action = {type: 'robot:RUN_RESPONSE', error: false}

    expect(makeEvent(state, action)).toEqual({
      name: 'runFinish',
      properties: {runTime: 4},
    })
  })

  test('robot:RUN_RESPONSE error -> runError event', () => {
    const state = {}
    const action = {type: 'robot:RUN_RESPONSE', error: new Error('AH')}

    expect(makeEvent(state, action)).toEqual({
      name: 'runError',
      properties: {error: 'AH'},
    })
  })
})
