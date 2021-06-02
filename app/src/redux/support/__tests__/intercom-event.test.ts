import type { State } from '../../types'
import * as Binding from '../intercom-binding'
import * as Calibration from '../../calibration'
import * as Config from '../../config'
import * as Sessions from '../../sessions'
import * as Analytics from '../../analytics'
import { makeIntercomEvent, sendEvent } from '../intercom-event'
import * as Constants from '../constants'

jest.mock('../intercom-binding')
jest.mock('../../analytics/selectors')

const getAnalyticsHealthCheckData = Analytics.getAnalyticsHealthCheckData as jest.MockedFunction<
  typeof Analytics.getAnalyticsHealthCheckData
>

const sendIntercomEvent = Binding.sendIntercomEvent as jest.MockedFunction<
  typeof Binding.sendIntercomEvent
>

const MOCK_STATE: State = {} as any

describe('support event tests', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('makeIntercomEvent should ignore unhandled events', () => {
    const built = makeIntercomEvent(
      Config.toggleConfigValue('some-random-path'),
      MOCK_STATE
    )
    expect(built).toBeNull()
  })

  it('sendEvent should pass on its arguments', () => {
    const props = {
      eventName: Constants.INTERCOM_EVENT_CALCHECK_COMPLETE,
      metadata: {
        someKey: true,
        someOtherKey: 'hi',
      },
    }
    sendEvent(props)
    expect(sendIntercomEvent).toHaveBeenCalledWith(
      props.eventName,
      props.metadata
    )
  })

  describe('calibration check deleted sessions', () => {
    it('makeIntercomEvent should ignore unhandled events', () => {
      const built = makeIntercomEvent(
        Sessions.createSession(
          'whocares',
          Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
          {}
        ),
        MOCK_STATE
      )
      expect(built).toBeNull()
    })

    it('makeIntercomEvent should send an event for calibration check complete', () => {
      const selectorValue = {
        pipettes: {
          left: { succeeded: false, comparisons: {}, model: 'some model' },
          right: null,
        },
      }
      getAnalyticsHealthCheckData.mockReturnValue(selectorValue)
      const built = makeIntercomEvent(
        Sessions.deleteSession('silly-robot', 'dummySessionID'),
        MOCK_STATE
      )
      expect(built).toEqual({
        eventName: Constants.INTERCOM_EVENT_CALCHECK_COMPLETE,
        metadata: selectorValue,
      })
    })

    it('makeIntercomEvent should ignore events for which no data can be retrieved', () => {
      getAnalyticsHealthCheckData.mockReturnValue(null)
      const built = makeIntercomEvent(
        Sessions.deleteSession('silly-robot', 'dummySessionID'),
        MOCK_STATE
      )
      expect(built).toBeNull()
    })
  })

  describe('calibration block event', () => {
    it('makeIntercomEvent should send an event for no cal block selected', () => {
      expect(
        makeIntercomEvent(
          Calibration.setUseTrashSurfaceForTipCal(true),
          MOCK_STATE
        )
      ).toEqual({
        eventName: Constants.INTERCOM_EVENT_NO_CAL_BLOCK,
        metadata: {},
      })
    })
    it('makeIntercomEvent should not send an event for cal block present', () => {
      expect(
        makeIntercomEvent(
          Calibration.setUseTrashSurfaceForTipCal(false),
          MOCK_STATE
        )
      ).toBe(null)
    })
  })
})
