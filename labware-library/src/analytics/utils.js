// @flow
import cookie from 'cookie'

import { initializeMixpanel, mixpanelOptIn, mixpanelOptOut } from './mixpanel'
import { initializeFullstory, shutdownFullstory } from './fullstory'
import type { AnalyticsState } from './types'

const COOKIE_KEY_NAME = 'ot_ll_analytics' // NOTE: cookie is named "LL" but only LC uses it now
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? 'opentrons.com' : undefined

const persistAnalyticsCookie = (cookies: { [key: string]: any }) => {
  const maxAge = 10 * 365 * 24 * 60 * 60 // 10 years
  const options = { COOKIE_DOMAIN, maxAge }

  global.document.cookie = cookie.serialize(
    COOKIE_KEY_NAME,
    JSON.stringify(cookies),
    options
  )
}

const getAnalyticsCookie = (): $Shape<AnalyticsState> => {
  const cookies = cookie.parse(global.document.cookie)
  const analyticsCookie = cookies[COOKIE_KEY_NAME]
    ? JSON.parse(cookies[COOKIE_KEY_NAME])
    : {}
  return analyticsCookie
}

// default initial value
export const getDefaultAnalyticsState = (): AnalyticsState => ({
  optedIn: false,
  seenOptIn: false,
})

export const initializeAnalytics = (state: AnalyticsState) => {
  // Intended to run only once, to init all analytics.
  // This should NOT depend on opt in/out state.
  console.debug('initializing analytics')

  initializeMixpanel()
  persistAnalyticsState(state)
}

export const getAnalyticsState = (): AnalyticsState => {
  const state = getAnalyticsCookie()

  if (
    // verify cookie properties
    typeof state.optedIn !== 'boolean' ||
    typeof state.seenOptIn !== 'boolean'
  ) {
    // reset
    console.debug(
      'never seen opt in, or invalid analytics state. Resetting analytics state'
    )

    return getDefaultAnalyticsState()
  }

  return state
}

// NOTE: Fullstory has no opt-in/out, control by adding/removing it completely

export const persistAnalyticsState = (state: AnalyticsState) => {
  persistAnalyticsCookie(state)

  if (state.optedIn) {
    mixpanelOptIn()
    initializeFullstory()
  } else {
    mixpanelOptOut()
    shutdownFullstory()
  }
}
