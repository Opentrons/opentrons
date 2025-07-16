import { useAtom } from 'jotai'

import { trackEvent } from '../../analytics/mixpanel'
import { featureFlagsAtom, mixpanelAtom } from '../atoms'

import type { AnalyticsEvent } from '../types'

/**
 * React hook to send an analytics tracking event directly from a component
 *
 * @returns {AnalyticsEvent => void} track event function
 */
export function useTrackEvent(): (e: AnalyticsEvent) => void {
  const [mixpanel] = useAtom(mixpanelAtom)
  const [featureFlags] = useAtom(featureFlagsAtom)

  return event => {
    // Analytics must be enabled in both feature flags AND mixpanel state
    const featureFlagEnabled = featureFlags.enableAnalytics ?? true
    const mixpanelOptedIn = mixpanel?.analytics?.hasOptedIn ?? false
    const analyticsEnabled = featureFlagEnabled && mixpanelOptedIn

    trackEvent(event, analyticsEnabled)
  }
}
