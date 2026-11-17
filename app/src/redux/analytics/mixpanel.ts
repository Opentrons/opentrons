import mixpanel from 'mixpanel-browser'

import { CURRENT_VERSION } from '../shell'

import type { Config as MixpanelConfig } from 'mixpanel-browser'
import type { AnalyticsConfig, AnalyticsEvent } from './types'

const LOG_TAG = 'app/src/redux/analytics/mixpanel.ts'

// pulled in from environment at build time
const MIXPANEL_ID = _OT_APP_MIXPANEL_ID_

const MIXPANEL_OPTS: Partial<MixpanelConfig> = {
  // opt out by default
  opt_out_tracking_by_default: true,
  // user details are persisted in our own config store
  disable_persistence: true,
  // pageviews tracked manually via connected-react-router events
  track_pageview: false,
}

const initMixpanelInstanceOnce = initializeMixpanelInstanceOnce(MIXPANEL_ID)

export function initializeMixpanel(
  config: AnalyticsConfig,
  isOnDevice: boolean | null
): void {
  if (MIXPANEL_ID != null) {
    try {
      initMixpanelInstanceOnce(config)
      setMixpanelTracking(config, isOnDevice)
      trackEvent({ name: 'appOpen', properties: {} }, config)
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error)
    }
  } else {
    console.warn(
      `[${LOG_TAG}]: MIXPANEL_ID not found; this is a bug if build is production`
    )
  }
}

export function trackEvent(
  event: AnalyticsEvent,
  config: AnalyticsConfig
): void {
  const { optedIn } = config
  const name =
    'name' in event && event.name != null ? event.name : 'unknown event'

  console.debug(`[${LOG_TAG}]: Trackable event: ${name}`, { event, optedIn })
  if (MIXPANEL_ID != null && optedIn) {
    try {
      if (event.superProperties != null) {
        mixpanel.register(event.superProperties)
      }
      if ('name' in event && event.name != null) {
        mixpanel.track(event.name, event.properties)
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }
}

export function setMixpanelTracking(
  config: AnalyticsConfig,
  isOnDevice: boolean | null
): void {
  if (MIXPANEL_ID != null) {
    initMixpanelInstanceOnce(config)
    try {
      if (config.optedIn) {
        console.debug(
          `[${LOG_TAG}]: User has opted into analytics; tracking with Mixpanel`
        )
        mixpanel.identify(config.appId)
        mixpanel.opt_in_tracking()
        mixpanel.register({
          appVersion: CURRENT_VERSION,
          appId: config.appId,
          appMode: Boolean(isOnDevice) ? 'ODD' : 'Desktop',
        })
      } else {
        console.debug(
          `[${LOG_TAG}]: User has opted out of analytics; stopping tracking`
        )
        mixpanel.opt_out_tracking()
        mixpanel.reset()
      }
    } catch (error) {
      console.error('Failed to set Mixpanel tracking:', error)
    }
  }
}

function initializeMixpanelInstanceOnce(
  MIXPANEL_ID?: string
): (config: AnalyticsConfig) => undefined {
  let hasBeenInitialized = false

  return function (config: AnalyticsConfig): undefined {
    if (!hasBeenInitialized && MIXPANEL_ID != null) {
      try {
        hasBeenInitialized = true
        console.debug(`[${LOG_TAG}]: Initializing Mixpanel`, { config })
        mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)
      } catch (error) {
        console.error('Failed to initialize Mixpanel instance:', error)
      }
    }
  }
}
