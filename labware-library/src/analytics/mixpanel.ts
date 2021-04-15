// TODO: Ian 2019-10-03 consolidate this with app/src/analytics/mixpanel.js
// (which this is copied from with slight modification)
import mixpanel from 'mixpanel-browser'

// pulled in from environment at build time
const MIXPANEL_ID = process.env.OT_LL_MIXPANEL_ID

const MIXPANEL_OPTS = {
  // opt out by default
  opt_out_tracking_by_default: true,
  track_pageview: true,
}

export function mixpanelOptIn(): void {
  if (MIXPANEL_ID) {
    console.debug('User has opted into analytics; tracking with Mixpanel')
    mixpanel.opt_in_tracking()
  }
}

export function mixpanelOptOut(): void {
  if (MIXPANEL_ID) {
    console.debug('User has opted out of analytics; stopping tracking')
    mixpanel.opt_out_tracking()
  }
}

export function initializeMixpanel(): void {
  if (MIXPANEL_ID) {
    console.debug('Initializing Mixpanel')
    mixpanel.init(MIXPANEL_ID, MIXPANEL_OPTS)
  } else {
    console.warn('MIXPANEL_ID not found; this is a bug if build is production')
  }
}

export const trackWithMixpanel = (
  name: string,
  properties?: Record<string, unknown>
): void => {
  mixpanel.track(name, properties)
}
