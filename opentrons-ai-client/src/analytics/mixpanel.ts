import mixpanel from 'mixpanel-browser'
import { getHasOptedIn } from './selectors'
import type { Mixpanel } from '../resources/types'

export type AnalyticsEvent =
  | {
      name: string
      properties: Record<string, unknown>
      superProperties?: Record<string, unknown>
    }
  | { superProperties: Record<string, unknown> }

// pulled in from environment at build time
const MIXPANEL_ID = process.env.OT_AI_CLIENT_MIXPANEL_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
}

export function initializeMixpanel(state: Mixpanel): void {
  const optedIn = getHasOptedIn(state) ?? false
  if (MIXPANEL_ID != null) {
    console.debug('Initializing Mixpanel', { optedIn })

    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)
    setMixpanelTracking(optedIn)
    trackEvent({ name: 'appOpen', properties: {} }, optedIn) // TODO IMMEDIATELY: do we want this?
  } else {
    console.warn('MIXPANEL_ID not found; this is a bug if build is production')
  }
}

export function trackEvent(event: AnalyticsEvent, optedIn: boolean): void {
  console.debug('Trackable event', { event, optedIn })
  if (MIXPANEL_ID != null && optedIn) {
    if ('superProperties' in event && event.superProperties != null) {
      mixpanel.register(event.superProperties)
    }
    if ('name' in event && event.name != null) {
      mixpanel.track(event.name, event.properties)
    }
  }
}

export function setMixpanelTracking(optedIn: boolean): void {
  if (MIXPANEL_ID != null) {
    if (optedIn) {
      console.debug('User has opted into analytics; tracking with Mixpanel')
      mixpanel.opt_in_tracking()
      // Register "super properties" which are included with all events
      mixpanel.register({
        appVersion: 'test', // TODO update this?
        appName: 'opentronsAIClient',
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
