import { useAtom } from 'jotai'
import { trackEvent } from '../../analytics/mixpanel'
import { mixpanelAtom } from '../atoms'
import type { AnalyticsEvent } from '../types'

/**
 * React hook to send an analytics tracking event directly from a component
 *
 * @returns {AnalyticsEvent => void} track event function
 */
export function useTrackEvent(): (e: AnalyticsEvent) => void {
  const [mixpanel] = useAtom(mixpanelAtom)
  return event => {
    trackEvent(event, mixpanel?.analytics?.hasOptedIn ?? false)
  }
}
