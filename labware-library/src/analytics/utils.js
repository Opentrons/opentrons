// @flow
import cookie from 'cookie'

import { initializeMixpanel, mixpanelOptIn, mixpanelOptOut } from './mixpanel'
import { initializeFullstory, shutdownFullstory } from './fullstory'
import type { AnalyticsState } from './types'

const COOKIE_KEY_NAME = 'ot_ll_analytics' // NOTE: cookie is named "LL" but only LC uses it now
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? 'opentrons.com' : undefined

export const persistAnalyticsCookie = (cookies: { [key: string]: any }) => {
  const maxAge = 10 * 365 * 24 * 60 * 60 // 10 years
  const options = { COOKIE_DOMAIN, maxAge }

  global.document.cookie = cookie.serialize(
    COOKIE_KEY_NAME,
    JSON.stringify(cookies),
    options
  )
}

export const getAnalyticsCookie = (): $Shape<AnalyticsState> => {
  const cookies = cookie.parse(global.document.cookie)
  const analyticsCookie = cookies[COOKIE_KEY_NAME]
    ? JSON.parse(cookies[COOKIE_KEY_NAME])
    : {}
  return analyticsCookie
}

export const initializeAnalytics = () => {
  // Intended to run only once, to init all analytics.
  // This should NOT depend on opt in/out state.
  console.debug('initializing analytics')
  initializeMixpanel()
}

export const _getInitialAnalyticsState = (): AnalyticsState => {
  // NOTE: this writes analytics cookies if none exist
  const parsedCookies = getAnalyticsCookie()

  if (
    parsedCookies.seenOptIn === true &&
    // verify cookie properties
    typeof parsedCookies.seenOptIn === 'boolean'
  ) {
    return parsedCookies
  } else {
    // reset
    console.debug(
      'never seen opt in, or invalid analytics state. Resetting analytics state'
    )
    const initialState = {
      optedIn: false,
      seenOptIn: false,
    }
    persistAnalyticsCookie(initialState)
    return initialState
  }
}

// NOTE: Fullstory has no opt-in/out, control by adding/removing it completely

export const performOptIn = (s: AnalyticsState) => {
  mixpanelOptIn()
  initializeFullstory()
}

export const performOptOut = (s: AnalyticsState) => {
  mixpanelOptOut()
  shutdownFullstory()
}
