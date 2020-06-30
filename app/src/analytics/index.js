// @flow
// analytics module
import { toggleConfigValue, updateConfigValue } from '../config'

import type {
  ToggleConfigValueAction,
  UpdateConfigValueAction,
} from '../config/types'

export * from './hooks'
export * from './selectors'

export function toggleAnalyticsOptedIn(): ToggleConfigValueAction {
  return toggleConfigValue('analytics.optedIn')
}

export function setAnalyticsOptInSeen(): UpdateConfigValueAction {
  return updateConfigValue('analytics.seenOptIn', true)
}
