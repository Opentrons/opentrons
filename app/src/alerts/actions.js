// @flow

import * as Constants from './constants'
import * as Types from './types'

export const alertTriggered = (
  alertId: Types.AlertId
): Types.AlertTriggeredAction => ({
  type: Constants.ALERT_TRIGGERED,
  payload: { alertId },
})

export const alertDismissed = (
  alertId: Types.AlertId,
  remember: boolean = false
): Types.AlertDismissedAction => ({
  type: Constants.ALERT_DISMISSED,
  payload: { alertId, remember },
})
