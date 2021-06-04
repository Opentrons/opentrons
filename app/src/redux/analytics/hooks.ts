import { useSelector } from 'react-redux'

import { getConfig } from '../config'
import { trackEvent } from './mixpanel'

import type { State } from '../types'
import type { Config } from '../config/types'
import type { AnalyticsEvent } from './types'

/**
 * React hook to send an analytics tracking event directly from a component
 *
 * @returns {AnalyticsEvent => void} track event function
 */
export function useTrackEvent(): (e: AnalyticsEvent) => void {
  const config: Config['analytics'] | undefined = useSelector(
    (state: State) => getConfig(state)?.analytics
  )
  return event => config && trackEvent(event, config)
}
