// @flow
import cookie from 'cookie'
import uuid from 'uuid/v4'

import { initializeMixpanel, mixpanelOptIn, mixpanelOptOut } from './mixpanel'
import type { AnalyticsState } from './types'

const COOKIE_PREFIX = 'ot_lc_' // NOTE: cookies are in LC b/c we don't have a plan for LL yet
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? 'opentrons.com' : undefined

export const persistCookies = (cookies: { [key: string]: any }) => {
  const maxAge = 10 * 365 * 24 * 60 * 60 // 10 years
  const options = { COOKIE_DOMAIN, maxAge }

  const cookiesList = Object.keys(cookies)

  cookiesList.forEach(key => {
    console.log('saving cookie', `${COOKIE_PREFIX}${key}`, cookies[key])
    global.document.cookie = cookie.serialize(
      `${COOKIE_PREFIX}${key}`,
      cookies[key],
      options
    )
  })
}

export const getAnalyticsCookies = (): $Shape<AnalyticsState> => {
  const cookies = cookie.parse(global.document.cookie, { decode: JSON.parse })
  const relevantKeys = ['trackingUUID', 'optedIn', 'seenOptIn']
  return relevantKeys.reduce((acc, key) => {
    const value = cookies[`${COOKIE_PREFIX}${key}`]
    return value === undefined ? acc : { ...acc, [key]: value }
  }, {})
}

export const initializeAnalytics = () => {
  // Intended to run only once, to init all analytics.
  // This should NOT depend on opt in/out state.
  console.debug('initializing analytics')
  initializeMixpanel()
}

export const _getInitialAnalyticsState = (): AnalyticsState => {
  // NOTE: this writes analytics cookies if none exist
  const parsedCookies = getAnalyticsCookies()

  if (
    parsedCookies.seenOptIn === true &&
    typeof parsedCookies.trackingUUID === 'string' &&
    typeof parsedCookies.seenOptIn === 'boolean'
  ) {
    return parsedCookies
  } else {
    // missing (or perhaps unexpected) cookie state
    console.debug('no analytics cookie found, creating cookie', parsedCookies)
    const initialState = {
      optedIn: false,
      seenOptIn: false,
      trackingUUID: uuid(),
    }
    persistCookies(initialState)
    return initialState
  }
}

export const performOptIn = (s: AnalyticsState) => {
  mixpanelOptIn(s.trackingUUID)
}

export const performOptOut = (s: AnalyticsState) => {
  mixpanelOptOut()
}
