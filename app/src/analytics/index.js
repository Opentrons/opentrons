// @flow
// analytics module
import { toggleConfigValue, updateConfigValue } from '../config'

import type { State } from '../types'
import type {
  ToggleConfigValueAction,
  UpdateConfigValueAction,
} from '../config/types'

export * from './hooks'
export * from './selectors'

export function toggleAnalyticsOptedIn(): ToggleConfigValueAction {
  return toggleConfigValue('analytics.optedIn')
}

export function setAnalyticsSeen(): UpdateConfigValueAction {
  return updateConfigValue('analytics.seenOptIn', true)
}

export function getAnalyticsOptedIn(state: State): boolean {
  return state.config?.analytics.optedIn ?? false
}

export function getAnalyticsSeen(state: State): boolean {
  return state.config?.analytics.seenOptIn ?? true
}
