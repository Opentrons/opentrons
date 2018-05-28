// @flow
// analytics module
import noop from 'lodash/noop'
import {LOCATION_CHANGE} from 'react-router-redux'
import mixpanel from 'mixpanel-browser'

import type {ThunkAction, Middleware} from '../types'
import type {Config} from '../config'

import {version} from '../../package.json'
import {updateConfig} from '../config'
import createLogger from '../logger'
import makeEvent from './make-event'

type AnalyticsConfig = $PropertyType<Config, 'analytics'>

const log = createLogger(__filename)

// pulled in from environment at build time
const INTERCOM_ID = process.env.OT_APP_INTERCOM_ID
const MIXPANEL_ID = process.env.OT_APP_MIXPANEL_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
  // user details are persisted in our own config store
  disable_persistence: true,
  // pageviews tracked manually via react-router-redux events
  track_pageview: false
}

// intercom and mixpanel.track handlers (noop)
let intercom = noop
let track = noop

export function initializeAnalytics (): ThunkAction {
  return (_, getState) => {
    const config = getState().config.analytics

    log.debug('Initializing analytics', {config})
    initializeIntercom(config)
    initializeMixpanel(config)
  }
}

export function optIntoAnalytics (): * {
  return updateConfig('analytics.optedIn', true)
}

export const analyticsMiddleware: Middleware =
  (store) => (next) => (action) => {
    const {type} = action
    const event = makeEvent(store.getState(), action)

    if (event) {
      log.debug('Trackable event', {type: action.type, event})
      track(event.name, event.properties)
    }

    if (type === LOCATION_CHANGE) {
      // update intercom on page change
      intercom('update')
    }

    return next(action)
  }

function initializeIntercom (config: AnalyticsConfig) {
  if (INTERCOM_ID) {
    const data = {app_id: INTERCOM_ID, 'App Version': version}

    intercom = global.Intercom || intercom
    intercom('boot', data)
  }
}

function initializeMixpanel (config: AnalyticsConfig) {
  if (MIXPANEL_ID) {
    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)

    if (config.optedIn) {
      log.debug('User has opted into analytics; enabling mixpanel')

      mixpanel.identify(config.appId)
      mixpanel.opt_in_tracking()
      mixpanel.register({appVersion: version, appId: config.appId})

      track = mixpanel.track.bind(mixpanel)
      track('appOpened')
    }
  }
}
