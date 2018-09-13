// @flow
// analytics module
import noop from 'lodash/noop'
import mixpanel from 'mixpanel-browser'

import type {State, ThunkAction, Middleware} from '../types'
import type {Config} from '../config'

import {version} from '../../package.json'
import {updateConfig} from '../config'
import createLogger from '../logger'
import makeEvent from './make-event'

type AnalyticsConfig = $PropertyType<Config, 'analytics'>

const log = createLogger(__filename)

// pulled in from environment at build time
const MIXPANEL_ID = process.env.OT_APP_MIXPANEL_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
  // user details are persisted in our own config store
  disable_persistence: true,
  // pageviews tracked manually via react-router-redux events
  track_pageview: false,
}

// mixpanel.track handler (default noop)
let track = noop

export function initializeAnalytics (): ThunkAction {
  return (_, getState) => {
    const config = getState().config.analytics

    log.debug('Analytics config', {config})
    initializeMixpanel(config)
  }
}

export function toggleAnalyticsOptedIn (): ThunkAction {
  return (dispatch, getState) => {
    const optedIn = getAnalyticsOptedIn(getState())
    return dispatch(updateConfig('analytics.optedIn', !optedIn))
  }
}

export function setAnalyticsSeen () {
  return updateConfig('analytics.seenOptIn', true)
}

export const analyticsMiddleware: Middleware =
  (store) => (next) => (action) => {
    const state = store.getState()
    const event = makeEvent(store.getState(), action)

    if (event) {
      log.debug('Trackable event', {type: action.type, event})
      track(event.name, event.properties)
    }

    // enable mixpanel tracking if optedIn goes to true
    if (
      action.type === 'config:SET' &&
      action.payload.path === 'analytics.optedIn'
    ) {
      const config = state.config.analytics

      if (action.payload.value === true) {
        enableMixpanelTracking(config)
      } else {
        disableMixpanelTracking(config)
      }
    }

    return next(action)
  }

export function getAnalyticsOptedIn (state: State) {
  return state.config.analytics.optedIn
}

export function getAnalyticsSeen (state: State) {
  return state.config.analytics.seenOptIn
}

function initializeMixpanel (config: AnalyticsConfig) {
  if (MIXPANEL_ID) {
    log.debug('Initializing Mixpanel')

    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)

    if (config.optedIn) {
      enableMixpanelTracking(config)
      track('appOpen')
    }
  }
}

function enableMixpanelTracking (config: AnalyticsConfig) {
  if (MIXPANEL_ID) {
    log.debug('User has opted into analytics; tracking with Mixpanel')

    mixpanel.identify(config.appId)
    mixpanel.opt_in_tracking()
    mixpanel.register({appVersion: version, appId: config.appId})

    track = mixpanel.track.bind(mixpanel)
  }
}

function disableMixpanelTracking (config: AnalyticsConfig) {
  if (MIXPANEL_ID) {
    log.debug('User has opted out of analytics; stopping tracking')

    mixpanel.opt_out_tracking()
    mixpanel.reset()

    track = noop
  }
}
