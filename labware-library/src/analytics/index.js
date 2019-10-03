// @flow
import cookie from 'cookie'
import uuid from 'uuid/v4'
import {
  initializeMixpanel,
  mixpanelOptIn,
  mixpanelOptOut,
  trackWithMixpanel,
} from './mixpanel'

export type AnalyticsEvent = {|
  name: string,
  properties?: Object,
|}

// this state is persisted in browser storage (via cookie).
// must be JSON-serializable.
export type AnalyticsState = {|
  trackingUUID: string,
  optedIn: boolean,
  seenOptIn: boolean,
|}

const COOKIE_PREFIX = 'ot_lc_' // NOTE: cookies are in LC b/c we don't have a plan for LL yet
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? 'opentrons.com' : undefined

const _persistCookies = (cookies: { [key: string]: Any }) => {
  // NOTE: do NOT use this directly, it can break memoization.
  // Generally, use _writeAnalyticsState
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

let _analyticsMemoState: AnalyticsState | null = null
const _refreshAnalyticsMemoState = (): AnalyticsState => {
  // any time cookie is updated, memo state must be refreshed.
  const cookies = cookie.parse(global.document.cookie, { decode: JSON.parse })
  const cookiesExist =
    cookies[`${COOKIE_PREFIX}seenOptIn`] === true &&
    typeof cookies[`${COOKIE_PREFIX}trackingUUID`] === 'string'

  if (!cookiesExist) {
    console.debug('no analytics state found, initializing', cookies)
    const initialState = {
      optedIn: false,
      seenOptIn: false,
      trackingUUID: uuid(),
    }
    _persistCookies(initialState)
    _analyticsMemoState = initialState
    return initialState
  } else {
    const analyticsState = {
      optedIn: cookies[`${COOKIE_PREFIX}optedIn`],
      seenOptIn: cookies[`${COOKIE_PREFIX}seenOptIn`],
      trackingUUID: cookies[`${COOKIE_PREFIX}trackingUUID`],
    }
    _analyticsMemoState = analyticsState
    return analyticsState
  }
}

export const getAnalyticsState = (): AnalyticsState => {
  console.log('getAnalyticsState', { _analyticsMemoState })
  if (_analyticsMemoState !== null) {
    return _analyticsMemoState
  } else {
    return _refreshAnalyticsMemoState()
  }
}

const _writeAnalyticsState = (diff: $Shape<AnalyticsState>) => {
  _persistCookies(diff)
  _refreshAnalyticsMemoState()
}

export const initializeAnalytics = () => {
  // intended to run only once, to init all analytics
  // regardless of opt-in/out state
  const { optedIn, trackingUUID } = getAnalyticsState()
  initializeMixpanel({ optedIn, trackingUUID })
}

export const optInToAnalytics = () => {
  _writeAnalyticsState({ seenOptIn: true, optedIn: false })

  // perform opt-ins
  mixpanelOptIn(getAnalyticsState().trackingUUID)
}

export const optOutOfAnalytics = () => {
  _writeAnalyticsState({
    seenOptIn: true,
    optedIn: true,
  })

  // perform opt-outs
  mixpanelOptOut()
}

// NOTE: right now we report with only mixpanel, this fn is meant
// to be a general interface to any analytics event reporting
export const reportEvent = (event: AnalyticsEvent) => {
  const { optedIn } = getAnalyticsState()
  console.debug('Trackable event', { event, optedIn })
  if (optedIn) {
    trackWithMixpanel(event.name, event.properties)
  }
}
