// @flow

import typeof {
  ALERT_DISMISSED,
  ALERT_TRIGGERED,
  ALERT_U2E_DRIVER_OUTDATED,
} from './constants.js'

export type AlertId = ALERT_U2E_DRIVER_OUTDATED

export type AlertTriggeredAction = {|
  type: ALERT_TRIGGERED,
  payload: {| alertId: AlertId |},
|}

export type AlertDismissedAction = {|
  type: ALERT_DISMISSED,
  payload: {| alertId: AlertId, remember: boolean |},
|}

export type AlertsAction = AlertTriggeredAction | AlertDismissedAction

export type AlertsState = $ReadOnly<{|
  active: $ReadOnlyArray<AlertId>,
  ignored: $ReadOnlyArray<AlertId>,
|}>
