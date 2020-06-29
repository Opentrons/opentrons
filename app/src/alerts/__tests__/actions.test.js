// @flow
import * as Actions from '../actions'
import type { AlertId, AlertsAction } from '../types'

const MOCK_ALERT_ID: AlertId = ('mockAlert': any)

type ActionSpec = {|
  should: string,
  creator: (...args: Array<any>) => AlertsAction,
  args: Array<mixed>,
  expected: AlertsAction,
|}

const SPECS: Array<ActionSpec> = [
  {
    should: 'allow an alert to be triggered',
    creator: Actions.alertTriggered,
    args: [MOCK_ALERT_ID],
    expected: {
      type: 'alerts:ALERT_TRIGGERED',
      payload: { alertId: MOCK_ALERT_ID },
    },
  },
  {
    should: 'allow an alert to be dismissed temporarily',
    creator: Actions.alertDismissed,
    args: [MOCK_ALERT_ID],
    expected: {
      type: 'alerts:ALERT_DISMISSED',
      payload: { alertId: MOCK_ALERT_ID, remember: false },
    },
  },
  {
    should: 'allow an alert to be dismissed permanently',
    creator: Actions.alertDismissed,
    args: [MOCK_ALERT_ID, true],
    expected: {
      type: 'alerts:ALERT_DISMISSED',
      payload: { alertId: MOCK_ALERT_ID, remember: true },
    },
  },
]

describe('alerts actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(`should ${should}`, () => {
      expect(creator).toEqual(expect.any(Function))
      expect(creator(...args)).toEqual(expected)
    })
  })
})
