// events map tests
import { makeEvent } from '../make-event'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'
import * as discoverySelectors from '../../discovery/selectors'
import * as selectors from '../selectors'

jest.mock('../selectors')
jest.mock('../../robot/selectors')
jest.mock('../../discovery/selectors')

describe('analytics events map', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('robot:CONNECT_RESPONSE -> robotConnected event', () => {
    discoverySelectors.getConnectedRobot.mockImplementation(state => {
      if (state === 'wired') {
        return {
          name: 'wired',
          ip: 'foo',
          port: 123,
          ok: true,
          serverOk: true,
          local: true,
          health: {},
          serverHealth: {},
        }
      }

      if (state === 'wireless') {
        return {
          name: 'wireless',
          ip: 'bar',
          port: 456,
          ok: true,
          serverOk: true,
          local: false,
          health: {},
          serverHealth: {},
        }
      }

      return null
    })

    const success = robotActions.connectResponse()
    const failure = robotActions.connectResponse(new Error('AH'))

    return Promise.all([
      expect(makeEvent(success, 'wired')).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'usb', success: true, error: '' },
      }),

      expect(makeEvent(failure, 'wired')).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'usb', success: false, error: 'AH' },
      }),

      expect(makeEvent(success, 'wireless')).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'wifi', success: true, error: '' },
      }),

      expect(makeEvent(failure, 'wireless')).resolves.toEqual({
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

    it('robot:PROTOCOL_UPLOAD > protocolUploadRequest', () => {
      const nextState = {}
      const success = { type: 'protocol:UPLOAD', payload: {} }

      return expect(makeEvent(success, nextState)).resolves.toEqual({
        name: 'protocolUploadRequest',
        properties: protocolData,
      })
    })

    it('robot:SESSION_RESPONSE with upload in flight', () => {
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

    it('robot:SESSION_ERROR with upload in flight', () => {
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

    it('robot:SESSION_RESPONSE/ERROR with no upload in flight', () => {
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

    it('robot:RUN -> runStart event', () => {
      const state = {}
      const action = { type: 'robot:RUN' }

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runStart',
        properties: protocolData,
      })
    })

    it('robot:RUN_RESPONSE success -> runFinish event', () => {
      const state = {}
      const action = { type: 'robot:RUN_RESPONSE', error: false }

      robotSelectors.getRunSeconds.mockReturnValue(4)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runFinish',
        properties: { ...protocolData, runTime: 4, success: true, error: '' },
      })
    })

    it('robot:RUN_RESPONSE error -> runFinish event', () => {
      const state = {}
      const action = {
        type: 'robot:RUN_RESPONSE',
        error: true,
        payload: new Error('AH'),
      }

      robotSelectors.getRunSeconds.mockReturnValue(4)

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

    it('robot:PAUSE -> runPause event', () => {
      const state = {}
      const action = { type: 'robot:PAUSE' }

      robotSelectors.getRunSeconds.mockReturnValue(4)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runPause',
        properties: {
          ...protocolData,
          runTime: 4,
        },
      })
    })

    it('robot:RESUME -> runResume event', () => {
      const state = {}
      const action = { type: 'robot:RESUME' }

      robotSelectors.getRunSeconds.mockReturnValue(4)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runResume',
        properties: {
          ...protocolData,
          runTime: 4,
        },
      })
    })

    it('robot:CANCEL-> runCancel event', () => {
      const state = {}
      const action = { type: 'robot:CANCEL' }

      robotSelectors.getRunSeconds.mockReturnValue(4)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'runCancel',
        properties: {
          ...protocolData,
          runTime: 4,
        },
      })
    })
  })

  describe('events with calibration data', () => {
    const robotCalibrationCheckSessionData = {
      instruments: {},
      currentStep: 'sessionStart',
      nextSteps: {
        links: { specifyLabware: '/fake/route' },
      },
      sessionToken: 'abc123',
    }

    it('calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS -> calibrationCheckStart event', () => {
      const state = {
        calibration: {
          'wiley-coyote': {
            robotCalibrationCheck: robotCalibrationCheckSessionData,
          },
        },
      }
      const action = {
        type: 'calibration:FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
        payload: { robotName: 'wiley-coyote' },
      }

      robotSelectors.getRunSeconds.mockReturnValue(4)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'calibrationCheckStart',
        properties: robotCalibrationCheckSessionData,
      })
    })

    it('calibration:COMPLETE_ROBOT_CALIBRATION_CHECK -> calibrationCheckPass event', () => {
      const state = {
        calibration: {
          'wiley-coyote': {
            robotCalibrationCheck: robotCalibrationCheckSessionData,
          },
        },
      }
      const action = {
        type: 'calibration:COMPLETE_ROBOT_CALIBRATION_CHECK',
        payload: { robotName: 'wiley-coyote' },
      }

      robotSelectors.getRunSeconds.mockReturnValue(4)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'calibrationCheckPass',
        properties: robotCalibrationCheckSessionData,
      })
    })
  })
})
