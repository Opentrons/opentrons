// @flow

import type { IntercomPayload } from '../types'
import type { State } from '../../types'
import * as Binding from '../intercom-binding'
import * as Calibration from '../../calibration'
import * as Config from '../../config'
import { makeIntercomEvent, sendEvent } from '../intercom-event'
import * as Constants from '../constants'

jest.mock('../intercom-binding')
jest.mock('../../sessions/selectors')

const sendIntercomEvent: JestMockFn<[string, IntercomPayload], void> =
  Binding.sendIntercomEvent

const MOCK_STATE: $Shape<{| ...State |}> = {}

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

  it('makeIntercomEvent should send an event for no cal block selected', () => {
    expect(makeIntercomEvent(
      Calibration.setUseTrashSurfaceForTipCal(true),
      MOCK_STATE
    )).toEqual({
      eventName: Constants.INTERCOM_EVENT_NO_CAL_BLOCK,
      metadata: {}
    })
  })
  it('makeIntercomEvent should not send an event for cal block present', () => {
    expect(makeIntercomEvent(
      Calibration.setUseTrashSurfaceForTipCal(false),
      MOCK_STATE
    )).toBe(null)
  })

  it('sendEvent should pass on its arguments', () => {
    const props = {
      eventName: Constants.INTERCOM_EVENT_NO_CAL_BLOCK,
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
