import * as Config from '../../config'
import * as Actions from '../actions'

import type { AlertId } from '../types'

const MOCK_ALERT_ID: AlertId = 'mockAlert' as any

describe('alerts actions', () => {
  it('should allow an alert to be triggered', () => {
    const result = Actions.alertTriggered(MOCK_ALERT_ID)

    expect(result).toEqual({
      type: 'alerts:ALERT_TRIGGERED',
      payload: { alertId: MOCK_ALERT_ID },
    })
  })

  it('should allow an alert to be dismissed temporarily', () => {
    const result = Actions.alertDismissed(MOCK_ALERT_ID)

    expect(result).toEqual({
      type: 'alerts:ALERT_DISMISSED',
      payload: { alertId: MOCK_ALERT_ID, remember: false },
    })
  })

  it('should allow an alert to be dismissed permanently', () => {
    const result = Actions.alertDismissed(MOCK_ALERT_ID, true)

    expect(result).toEqual({
      type: 'alerts:ALERT_DISMISSED',
      payload: { alertId: MOCK_ALERT_ID, remember: true },
    })
  })

  it('should allow an alert to be ignored permanently', () => {
    const result = Actions.alertPermanentlyIgnored(MOCK_ALERT_ID)

    expect(result).toEqual(
      Config.addUniqueConfigValue('alerts.ignored', MOCK_ALERT_ID)
    )
  })

  it('should allow an alert to be unignored', () => {
    const result = Actions.alertUnignored(MOCK_ALERT_ID)

    expect(result).toEqual(
      Config.subtractConfigValue('alerts.ignored', MOCK_ALERT_ID)
    )
  })
})
