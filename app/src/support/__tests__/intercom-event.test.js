// @flow

import type { IntercomPayload } from '../types'
import type { State } from '../../types'
import * as Binding from '../intercom-binding'
import * as Sessions from '../../sessions'
import * as SessionTypes from '../../sessions/types'
import { makeIntercomEvent, sendEvent } from '../intercom-event'
import * as Constants from '../constants'

jest.mock('../intercom-binding')
jest.mock('../../sessions/selectors')

const sendIntercomEvent: JestMockFn<[string, IntercomPayload], void> =
  Binding.sendIntercomEvent
const getIntercomEventPropsForRobotSessionById: JestMockFn<
  [State, string, string],
  SessionTypes.SessionIntercomProps | null
> = Sessions.getIntercomEventPropsForRobotSessionById

const MOCK_STATE: $Shape<{| ...State |}> = {}

describe('support event tests', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('makeIntercomEvent should ignore unhandled events', () => {
    const built = makeIntercomEvent(
      Sessions.createSession(
        'whocares',
        Sessions.SESSION_TYPE_CALIBRATION_CHECK,
        {}
      ),
      MOCK_STATE
    )
    expect(built).toBeNull()
  })

  it('makeIntercomEvent should send an event for calibration check complete', () => {
    const sessionState = {
      sessionType: 'calibrationCheck',
      succeeded: false,
      leftPipetteModel: 'p300_single_v2.0',
      comparingFirstPipetteHeightExceedsThreshold: true,
      comparingFirstPipetteHeightErrorSource: 'unknown',
    }
    getIntercomEventPropsForRobotSessionById.mockReturnValue(sessionState)
    const built = makeIntercomEvent(
      Sessions.deleteSession('silly-robot', 'dummySessionID'),
      MOCK_STATE
    )
    expect(built).toEqual({
      eventName: Constants.INTERCOM_EVENT_CALCHECK_COMPLETE,
      metadata: sessionState,
    })
  })

  it('makeIntercomEvent should ignore events for which no data can be retrieved', () => {
    getIntercomEventPropsForRobotSessionById.mockReturnValue(null)
    const built = makeIntercomEvent(
      Sessions.deleteSession('silly-robot', 'dummySessionID'),
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
})
