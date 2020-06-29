// @flow
import { fullstoryEvent } from './fullstory'
import { trackWithMixpanel } from './mixpanel'
import type { AnalyticsEvent } from './types'
import { getAnalyticsState } from './utils'

// NOTE: right now we report with only mixpanel, this fn is meant
// to be a general interface to any analytics event reporting
export const reportEvent = (event: AnalyticsEvent) => {
  // NOTE: this cookie parsing is not very performant, but this implementation
  // uses cookies as the source of truth (not `analyticsState` of the hook)
  const { optedIn } = getAnalyticsState()

  console.debug('Trackable event', { event, optedIn })
  if (optedIn) {
    trackWithMixpanel(event.name, event.properties)
    fullstoryEvent(event.name, event.properties)
  }
}
