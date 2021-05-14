import { addUniqueConfigValue, subtractConfigValue } from '../config'
import * as Constants from './constants'
import * as Types from './types'

import type {
  AddUniqueConfigValueAction,
  SubtractConfigValueAction,
} from '../config/types'

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

export const alertPermanentlyIgnored = (
  alertId: Types.AlertId
): AddUniqueConfigValueAction => {
  return addUniqueConfigValue(Constants.CONFIG_PATH_ALERTS_IGNORED, alertId)
}

export const alertUnignored = (
  alertId: Types.AlertId
): SubtractConfigValueAction => {
  return subtractConfigValue(Constants.CONFIG_PATH_ALERTS_IGNORED, alertId)
}
