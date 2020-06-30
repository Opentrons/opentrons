// @flow
import { useSelector } from 'react-redux'

import { getConfig } from '../config'
import type { State } from '../types'
import { trackEvent } from './mixpanel'

import type { AnalyticsEvent } from './types'

/**
 * React hook to send an analytics tracking event directly from a component
 *
 * @returns {AnalyticsEvent => void} track event function
 */
export function useTrackEvent(): AnalyticsEvent => void {
  const config = useSelector((state: State) => getConfig(state)?.analytics)
  return event => config && trackEvent(event, config)
}
