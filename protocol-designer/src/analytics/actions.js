// @flow
import { initializeFullstory, shutdownFullstory } from './fullstory'
import { setMixpanelTracking } from './mixpanel'
import type { AnalyticsEvent } from './mixpanel'

export type SetOptIn = {|
  type: 'SET_OPT_IN',
  payload: boolean,
|}

const _setOptIn = (payload: $PropertyType<SetOptIn, 'payload'>): SetOptIn => {
  // side effects
  if (payload) {
    initializeFullstory()
    setMixpanelTracking(true)
  } else {
    shutdownFullstory()
    setMixpanelTracking(false)
  }

  return {
    type: 'SET_OPT_IN',
    payload,
  }
}

export const optIn = (): SetOptIn => _setOptIn(true)
export const optOut = (): SetOptIn => _setOptIn(false)

export type AnalyticsEventAction = {|
  type: 'ANALYTICS_EVENT',
  payload: AnalyticsEvent,
|}

// NOTE: this action creator should only be used for special cases where you want to
// report an analytics event but you do not have any Redux action that sensibly represents
// that analytics event.
//
// When there *is* a Redux action associated with what you want to report to analytics,
// use the analytics middleware (usually this means adding a case to
// `reduxActionToAnalyticsEvent` fn) and don't dispatch ANALYTICS_EVENT.
//
// PS: ANALYTICS_EVENT action is effected by the analytics middleware anyway, because
// we need to read opt-in status from the Redux state.
export const analyticsEvent = (
  payload: AnalyticsEvent
): AnalyticsEventAction => ({ type: 'ANALYTICS_EVENT', payload })
