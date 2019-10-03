// @flow
// TODO: Ian 2019-10-03 consolidate this with app/src/analytics/mixpanel.js
// (which this is copied from with slight modification)
import mixpanel from 'mixpanel-browser'

// pulled in from environment at build time
const MIXPANEL_ID = process.env.OT_LL_MIXPANEL_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
  // user details are persisted in our own config store
  disable_persistence: true,
  track_pageview: true,
}

export type MixpanelConfig = {|
  optedIn: boolean,
  trackingUUID: string,
|}

export function mixpanelOptIn(trackingUUID: string) {
  if (MIXPANEL_ID) {
    console.debug('User has opted into analytics; tracking with Mixpanel')
    mixpanel.identify(trackingUUID)
    mixpanel.opt_in_tracking()
    mixpanel.register({ trackingUUID })
  }
}

export function mixpanelOptOut() {
  if (MIXPANEL_ID) {
    console.debug('User has opted out of analytics; stopping tracking')
    mixpanel.opt_out_tracking()
    mixpanel.reset()
  }
}

export function initializeMixpanel(config: MixpanelConfig) {
  if (MIXPANEL_ID) {
    console.debug('Initializing Mixpanel')
    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)
    if (config.optedIn) {
      mixpanelOptIn(config.trackingUUID)
    } else {
      mixpanelOptOut()
    }
  } else {
    console.warn('MIXPANEL_ID not found; this is a bug if build is production')
  }
}

export const trackWithMixpanel = (name: string, properties: Object) => {
  mixpanel.track(name, properties)
}
