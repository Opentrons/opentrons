// events map tests
import makeEvent from '../make-event'
import { actions as robotActions } from '../../robot'
import * as selectors from '../selectors'

jest.mock('../selectors')

describe('analytics events map', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('robot:CONNECT_RESPONSE -> robotConnected event', () => {
    const state = name => ({
      robot: {
        connection: {
          connectedTo: name,
        },
      },
      discovery: {
        robotsByName: {
          wired: [
            {
              name: 'wired',
              ip: 'foo',
              port: 123,
              ok: true,
              serverOk: true,
              local: true,
              health: {},
              serverHealth: {},
            },
          ],
          wireless: [
            {
              name: 'wireless',
              ip: 'bar',
              port: 456,
              ok: true,
              serverOk: true,
              local: false,
              health: {},
              serverHealth: {},
            },
          ],
        },
      },
    })

    const success = robotActions.connectResponse()
    const failure = robotActions.connectResponse(new Error('AH'))

    return Promise.all([
      expect(makeEvent(success, state('wired'))).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'usb', success: true, error: '' },
      }),

      expect(makeEvent(failure, state('wired'))).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'usb', success: false, error: 'AH' },
      }),

      expect(makeEvent(success, state('wireless'))).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'wifi', success: true, error: '' },
      }),

      expect(makeEvent(failure, state('wireless'))).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'wifi', success: false, error: 'AH' },
      }),
    ])
  })

  describe('events with protocol data', () => {
    var protocolData = { foo: 'bar' }

    beforeEach(() => {
      selectors.getProtocolAnalyticsData.mockResolvedValue(protocolData)
    })

    test('robot:PROTOCOL_UPLOAD > protocolUploadRequest', () => {
      const nextState = {}
      const success = { type: 'protocol:UPLOAD', payload: {} }

      return expect(makeEvent(success, nextState)).resolves.toEqual({
        name: 'protocolUploadRequest',
        properties: protocolData,
      })
    })

    test('robot:SESSION_RESPONSE with upload in flight', () => {
      const nextState = {}
      const success = {
        type: 'robot:SESSION_RESPONSE',
        payload: {},
        meta: { freshUpload: true },
      }

      return expect(makeEvent(success, nextState)).resolves.toEqual({
        name: 'protocolUploadResponse',
        properties: { success: true, error: '', ...protocolData },
      })
    })

    test('robot:SESSION_ERROR with upload in flight', () => {
      const nextState = {}
      const failure = {
        type: 'robot:SESSION_ERROR',
        payload: { error: new Error('AH') },
        meta: { freshUpload: true },
      }

      return expect(makeEvent(failure, nextState)).resolves.toEqual({
        name: 'protocolUploadResponse',
        properties: { success: false, error: 'AH', ...protocolData },
      })
    })

    test('robot:SESSION_RESPONSE/ERROR with no upload in flight', () => {
      const nextState = {}
      const success = {
        type: 'robot:SESSION_RESPONSE',
        payload: {},
        meta: { freshUpload: false },
      }
      const failure = {
        type: 'robot:SESSION_ERROR',
        payload: { error: new Error('AH') },
        meta: { freshUpload: false },
      }

      return Promise.all([
        expect(makeEvent(success, nextState)).resolves.toBeNull(),
        expect(makeEvent(failure, nextState)).resolves.toBeNull(),
      ])
    })

    test('robot:RUN -> runStart event', () => {
      const state = {}
      const action = { type: 'robot:RUN' }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runStart',
        properties: protocolData,
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
      const action = { type: 'robot:RUN_RESPONSE', error: false }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runFinish',
        properties: { ...protocolData, runTime: 4, success: true, error: '' },
      })
    })

    test('robot:RUN_RESPONSE error -> runFinish event', () => {
      const state = {
        robot: {
          session: {
            startTime: 1000,
            runTime: 5000,
          },
        },
      }
      const action = {
        type: 'robot:RUN_RESPONSE',
        error: true,
        payload: new Error('AH'),
      }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runFinish',
        properties: {
          ...protocolData,
          runTime: 4,
          success: false,
          error: 'AH',
        },
      })
    })

    test('robot:PAUSE -> runPause event', () => {
      const state = {
        robot: {
          session: {
            startTime: 1000,
            runTime: 5000,
          },
        },
      }
      const action = { type: 'robot:PAUSE' }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runPause',
        properties: {
          ...protocolData,
          runTime: 4,
        },
      })
    })

    test('robot:RESUME -> runResume event', () => {
      const state = {
        robot: {
          session: {
            startTime: 1000,
            runTime: 5000,
          },
        },
      }
      const action = { type: 'robot:RESUME' }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runResume',
        properties: {
          ...protocolData,
          runTime: 4,
        },
      })
    })

    test('robot:CANCEL-> runCancel event', () => {
      const state = {
        robot: {
          session: {
            startTime: 1000,
            runTime: 5000,
          },
        },
      }
      const action = { type: 'robot:CANCEL' }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runCancel',
        properties: {
          ...protocolData,
          runTime: 4,
        },
      })
    })
  })
})
