// analytics module
import { toggleConfigValue } from '../config'

import type { ToggleConfigValueAction } from '../config/types'

export * from './hooks'
export * from './selectors'
export * from './actions'
export * from './constants'

export function toggleAnalyticsOptedIn(): ToggleConfigValueAction {
  return toggleConfigValue('analytics.optedIn')
}
