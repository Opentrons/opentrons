// @flow
// analytics module
import { createLogger } from '../logger'
import { updateConfig } from '../config'
import { initializeMixpanel } from './mixpanel'

import type { State, ThunkAction } from '../types'

export * from './selectors'
export { analyticsEpic } from './epics'

const log = createLogger(__filename)

export function initializeAnalytics(): ThunkAction {
  return (_, getState) => {
    const config = getState().config.analytics

    log.debug('Analytics config', { config })
    initializeMixpanel(config)
  }
}

export function toggleAnalyticsOptedIn(): ThunkAction {
  return (dispatch, getState) => {
    const optedIn = getAnalyticsOptedIn(getState())
    return dispatch(updateConfig('analytics.optedIn', !optedIn))
  }
}

export function setAnalyticsSeen() {
  return updateConfig('analytics.seenOptIn', true)
}

export function getAnalyticsOptedIn(state: State) {
  return state.config.analytics.optedIn
}

export function getAnalyticsSeen(state: State) {
  return state.config.analytics.seenOptIn
}
