// @flow

import * as Actions from '../actions'
import { alertsReducer } from '../reducer'

import type { AlertId } from '../types'

const MOCK_ALERT_ID: AlertId = ('mockAlert': any)

describe('alerts reducer', () => {
  it('should handle ALERT_TRIGGERED', () => {
    const state = { active: [], ignored: [] }
    const action = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [MOCK_ALERT_ID],
      ignored: [],
    })
  })

  it('should handle ALERT_TRIGGERED if alert is already triggered', () => {
    const state = { active: [MOCK_ALERT_ID], ignored: [] }
    const action = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [MOCK_ALERT_ID],
      ignored: [],
    })
  })

  it('should handle ALERT_DISMISSED', () => {
    const state = { active: [MOCK_ALERT_ID], ignored: [] }
    const action = Actions.alertDismissed(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [],
      ignored: [MOCK_ALERT_ID],
    })
  })

  it('should handle ALERT_IGNORED if alert is already ignored', () => {
    const state = { active: [], ignored: [MOCK_ALERT_ID] }
    const action = Actions.alertDismissed(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [],
      ignored: [MOCK_ALERT_ID],
    })
  })

  it('should handle ALERT_TRIGGERED if alert is already ignored', () => {
    const state = { active: [], ignored: [MOCK_ALERT_ID] }
    const action = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [],
      ignored: [MOCK_ALERT_ID],
    })
  })
})
