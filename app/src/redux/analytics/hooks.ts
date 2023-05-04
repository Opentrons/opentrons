import { getConfig } from '../config'
import type { Config } from '../config/types'
import type { State } from '../types'
import { trackEvent } from './mixpanel'
import type { AnalyticsEvent } from './types'
import { useSelector } from 'react-redux'

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
