// @flow
// TODO(IL, 2020-09-09): reconcile with app/src/analytics/mixpanel.js, which this is derived from
import mixpanel from 'mixpanel-browser'
import { getHasOptedIn } from './selectors'
import type { BaseState } from '../types'

// TODO(IL, 2020-09-09): AnalyticsEvent type copied from app/src/analytics/types.js, consider merging
export type AnalyticsEvent =
  | {|
      name: string,
      properties: { ... },
      superProperties?: { ... },
    |}
  | {| superProperties: { ... } |}

// pulled in from environment at build time
const MIXPANEL_ID = process.env.OT_PD_MIXPANEL_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
}

export function initializeMixpanel(state: BaseState) {
  const optedIn = getHasOptedIn(state) || false
  if (MIXPANEL_ID) {
    console.debug('Initializing Mixpanel', { optedIn })

    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)
    setMixpanelTracking(optedIn)
    trackEvent({ name: 'appOpen', properties: {} }, optedIn) // TODO IMMEDIATELY: do we want this?
  } else {
    console.warn('MIXPANEL_ID not found; this is a bug if build is production')
  }
}

// NOTE: Do not use directly. Used in analytics Redux middleware: trackEventMiddleware.
export function trackEvent(event: AnalyticsEvent, optedIn: boolean) {
  console.debug('Trackable event', { event, optedIn })
  if (MIXPANEL_ID && optedIn) {
    if (event.superProperties) {
      mixpanel.register(event.superProperties)
    }
    if (event.name) {
      mixpanel.track(event.name, event.properties)
    }
  }
}

export function setMixpanelTracking(optedIn: boolean) {
  if (MIXPANEL_ID) {
    if (optedIn) {
      console.debug('User has opted into analytics; tracking with Mixpanel')
      mixpanel.opt_in_tracking()
      // Register "super properties" which are included with all events
      mixpanel.register({
        appVersion: process.env.OT_PD_VERSION,
      })
    } else {
      console.debug(
        'User has opted out of analytics; stopping Mixpanel tracking'
      )
      mixpanel.opt_out_tracking()
      mixpanel.reset()
    }
  }
}
