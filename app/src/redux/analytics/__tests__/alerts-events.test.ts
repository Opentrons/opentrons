import { makeEvent } from '../make-event'

import * as Alerts from '../../alerts'

import type { State } from '../../types'
import type { AlertId } from '../../alerts/types'

const MOCK_STATE: State = { mockState: true } as any
const MOCK_ALERT_ID: AlertId = 'fizzbuzz' as any

describe('custom labware analytics events', () => {
  it('should not trigger an event for random alerts', () => {
    const action = Alerts.alertDismissed(MOCK_ALERT_ID)
    const result = makeEvent(action, MOCK_STATE)

    return expect(result).resolves.toBe(null)
  })

  it('should trigger an event on alerts:ALERT_DISMISSED for appUpdateAvailable', () => {
    const action = Alerts.alertDismissed(Alerts.ALERT_APP_UPDATE_AVAILABLE)
    const result = makeEvent(action, MOCK_STATE)

    return expect(result).resolves.toEqual({
      name: 'appUpdateDismissed',
      properties: { updatesIgnored: false },
    })
  })

  it('should trigger an appUpdateDismissed event with ignored: true', () => {
    const action = Alerts.alertDismissed(
      Alerts.ALERT_APP_UPDATE_AVAILABLE,
      true
    )
    const result = makeEvent(action, MOCK_STATE)

    return expect(result).resolves.toEqual({
      name: 'appUpdateDismissed',
      properties: { updatesIgnored: true },
    })
  })
})
