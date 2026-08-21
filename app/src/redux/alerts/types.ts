import type {
  ALERT_APP_UPDATE_AVAILABLE,
  ALERT_DISMISSED,
  ALERT_TRIGGERED,
  ALERT_U2E_DRIVER_OUTDATED,
} from './constants'

export type AlertId =
  typeof ALERT_U2E_DRIVER_OUTDATED | typeof ALERT_APP_UPDATE_AVAILABLE

export interface AlertTriggeredAction {
  type: typeof ALERT_TRIGGERED
  payload: { alertId: AlertId }
}

export interface AlertDismissedAction {
  type: typeof ALERT_DISMISSED
  payload: { alertId: AlertId; remember: boolean }
}

export type AlertsAction = AlertTriggeredAction | AlertDismissedAction

export type AlertsState = Readonly<{
  active: AlertId[]
  ignored: AlertId[]
}>
