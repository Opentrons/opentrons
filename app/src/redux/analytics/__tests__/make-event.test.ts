// events map tests
import { makeEvent } from '../make-event'
import { connect } from '../../robot'
import * as discoverySelectors from '../../discovery/selectors'
import * as selectors from '../selectors'

jest.mock('../selectors')
jest.mock('../../robot/selectors')
jest.mock('../../sessions/selectors')
jest.mock('../../discovery/selectors')
jest.mock('../../pipettes/selectors')
jest.mock('../../calibration/selectors')

const getConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>
const getAnalyticsSessionExitDetails = selectors.getAnalyticsSessionExitDetails as jest.MockedFunction<
  typeof selectors.getAnalyticsSessionExitDetails
>
const getSessionInstrumentAnalyticsData = selectors.getSessionInstrumentAnalyticsData as jest.MockedFunction<
  typeof selectors.getSessionInstrumentAnalyticsData
>
const getAnalyticsHealthCheckData = selectors.getAnalyticsHealthCheckData as jest.MockedFunction<
  typeof selectors.getAnalyticsHealthCheckData
>
const getAnalyticsDeckCalibrationData = selectors.getAnalyticsDeckCalibrationData as jest.MockedFunction<
  typeof selectors.getAnalyticsDeckCalibrationData
>
const getAnalyticsPipetteCalibrationData = selectors.getAnalyticsPipetteCalibrationData as jest.MockedFunction<
  typeof selectors.getAnalyticsPipetteCalibrationData
>
const getAnalyticsTipLengthCalibrationData = selectors.getAnalyticsTipLengthCalibrationData as jest.MockedFunction<
  typeof selectors.getAnalyticsTipLengthCalibrationData
>
const getProtocolAnalyticsData = selectors.getProtocolAnalyticsData as jest.MockedFunction<
  typeof selectors.getProtocolAnalyticsData
>

describe('analytics events map', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('robot:CONNECT -> robotConnected event', () => {
    getConnectedRobot.mockImplementation((state: any): any => {
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

    return Promise.all([
      expect(makeEvent(connect('wired'), 'wired' as any)).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'usb', success: true },
      }),

      expect(
        makeEvent(connect('wireless'), 'wireless' as any)
      ).resolves.toEqual({
        name: 'robotConnect',
        properties: { method: 'wifi', success: true },
      }),
    ])
  })

  describe('events with protocol data', () => {
    const protocolData = { foo: 'bar' } as any

    beforeEach(() => {
      getProtocolAnalyticsData.mockResolvedValue(protocolData)
    })

    it('robot:PROTOCOL_LOAD > protocolUploadRequest', () => {
      const nextState = {} as any
      const success = { type: 'protocol:LOAD', payload: {} } as any

      return expect(makeEvent(success, nextState)).resolves.toEqual({
        name: 'protocolUploadRequest',
        properties: protocolData,
      })
    })

    it('robotAdmin:RESET_CONFIG -> resetRobotConfig event', () => {
      const state = {} as any
      const action = {
        type: 'robotAdmin:RESET_CONFIG',
        payload: {
          robotName: 'robotName',
          resets: {
            foo: true,
            bar: true,
          },
        },
      } as any
      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'resetRobotConfig',
        properties: {
          ...action.payload.resets,
        },
      })
    })
  })

  describe('events with calibration data', () => {
    it('analytics:PIPETTE_OFFSET_STARTED -> pipetteOffsetCalibrationStarted event', () => {
      const state = {} as any
      const action = {
        type: 'analytics:PIPETTE_OFFSET_STARTED',
        payload: {
          someStuff: 'some-other-stuff',
        },
      } as any
      getAnalyticsPipetteCalibrationData.mockReturnValue({
        markedBad: true,
        calibrationExists: true,
        pipetteModel: 'my pipette model',
      })
      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'pipetteOffsetCalibrationStarted',
        properties: {
          ...action.payload,
          calibrationExists: true,
          markedBad: true,
          pipetteModel: 'my pipette model',
        },
      })
    })

    it('analytics:TIP_LENGTH_STARTED -> tipLengthCalibrationStarted event', () => {
      const state = {} as any
      const action = {
        type: 'analytics:TIP_LENGTH_STARTED',
        payload: {
          someStuff: 'some-other-stuff',
        },
      } as any
      getAnalyticsTipLengthCalibrationData.mockReturnValue({
        markedBad: true,
        calibrationExists: true,
        pipetteModel: 'pipette-model',
      })
      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'tipLengthCalibrationStarted',
        properties: {
          ...action.payload,
          calibrationExists: true,
          markedBad: true,
          pipetteModel: 'pipette-model',
        },
      })
    })

    it('sessions:ENSURE_SESSION for deck cal -> deckCalibrationStarted event', () => {
      const state = {} as any
      const action = {
        type: 'sessions:ENSURE_SESSION',
        payload: {
          sessionType: 'deckCalibration',
        },
      } as any
      getAnalyticsDeckCalibrationData.mockReturnValue({
        calibrationStatus: 'IDENTITY',
        markedBad: true,
        pipettes: { left: { model: 'my pipette model' } },
      } as any)

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'deckCalibrationStarted',
        properties: {
          calibrationStatus: 'IDENTITY',
          markedBad: true,
          pipettes: { left: { model: 'my pipette model' } },
        },
      })
    })

    it('sessions:ENSURE_SESSION for health check -> calibrationHealthCheckStarted event', () => {
      const state = {} as any
      const action = {
        type: 'sessions:ENSURE_SESSION',
        payload: {
          sessionType: 'calibrationCheck',
        },
      } as any
      getAnalyticsHealthCheckData.mockReturnValue({
        pipettes: { left: { model: 'my pipette model' } },
      } as any)
      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'calibrationHealthCheckStarted',
        properties: {
          pipettes: { left: { model: 'my pipette model' } },
        },
      })
    })

    it('sessions:ENSURE_SESSION for other session -> no event', () => {
      const state = {} as any
      const action = {
        type: 'sessions:ENSURE_SESSION',
        payload: {
          sessionType: 'some-other-session',
        },
      } as any
      return expect(makeEvent(action, state)).resolves.toBeNull()
    })

    it('sessions:CREATE_SESSION_COMMAND for exit -> {type}Exit', () => {
      const state = {} as any
      const action = {
        type: 'sessions:CREATE_SESSION_COMMAND',
        payload: {
          robotName: 'my-robot',
          sessionId: 'seshid',
          command: { command: 'calibration.exitSession' },
        },
      } as any
      getAnalyticsSessionExitDetails.mockReturnValue({
        sessionType: 'my-session-type',
        step: 'session-step',
      })

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'my-session-typeExit',
        properties: { step: 'session-step' },
      })
    })

    it('sessions:CREATE_SESSION_COMMAND for loadLabware -> {type}Exit', () => {
      const state = {} as any
      const action = {
        type: 'sessions:CREATE_SESSION_COMMAND',
        payload: {
          robotName: 'my-robot',
          sessionId: 'seshid',
          command: {
            command: 'calibration.loadLabware',
            data: {
              tiprackDefinition: {
                metadata: { displayName: 'some display name' },
              },
            },
          },
        },
      } as any
      getSessionInstrumentAnalyticsData.mockReturnValue({
        sessionType: 'my-session-type',
        pipetteModel: 'my-pipette-model',
      })

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'my-session-typeTipRackSelect',
        properties: {
          pipetteModel: 'my-pipette-model',
          tipRackDisplayName: 'some display name',
        },
      })
    })
  })
})
