import * as Actions from '../actions'
import { alertsReducer } from '../reducer'

import type { AlertId, AlertsState } from '../types'

const MOCK_ALERT_ID: AlertId = 'mockAlert' as any

describe('alerts reducer', () => {
  it('should handle ALERT_TRIGGERED', () => {
    const state: AlertsState = { active: [], ignored: [] } as any
    const action = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [MOCK_ALERT_ID],
      ignored: [],
    })
  })

  it('should handle ALERT_TRIGGERED if alert is already triggered', () => {
    const state: AlertsState = { active: [MOCK_ALERT_ID], ignored: [] } as any
    const action = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [MOCK_ALERT_ID],
      ignored: [],
    })
  })

  it('should handle ALERT_DISMISSED', () => {
    const state: AlertsState = { active: [MOCK_ALERT_ID], ignored: [] } as any
    const action = Actions.alertDismissed(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [],
      ignored: [MOCK_ALERT_ID],
    })
  })

  it('should handle ALERT_DISMISSED if alert is already ignored', () => {
    const state: AlertsState = { active: [], ignored: [MOCK_ALERT_ID] } as any
    const action = Actions.alertDismissed(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [],
      ignored: [MOCK_ALERT_ID],
    })
  })

  it('should handle ALERT_TRIGGERED if alert is already ignored', () => {
    const state: AlertsState = { active: [], ignored: [MOCK_ALERT_ID] } as any
    const action = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(alertsReducer(state, action)).toEqual({
      active: [],
      ignored: [MOCK_ALERT_ID],
    })
  })
})
