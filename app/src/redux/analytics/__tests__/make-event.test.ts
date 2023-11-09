// events map tests
import { makeEvent } from '../make-event'
import * as selectors from '../selectors'

jest.mock('../selectors')
jest.mock('../../sessions/selectors')
jest.mock('../../discovery/selectors')
jest.mock('../../pipettes/selectors')
jest.mock('../../calibration/selectors')

const getAnalyticsSessionExitDetails = selectors.getAnalyticsSessionExitDetails as jest.MockedFunction<
  typeof selectors.getAnalyticsSessionExitDetails
>
const getSessionInstrumentAnalyticsData = selectors.getSessionInstrumentAnalyticsData as jest.MockedFunction<
  typeof selectors.getSessionInstrumentAnalyticsData
>

describe('analytics events map', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('events with protocol data', () => {
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
      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'pipetteOffsetCalibrationStarted',
        properties: {
          ...action.payload,
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
      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'tipLengthCalibrationStarted',
        properties: {
          ...action.payload,
        },
      })
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
