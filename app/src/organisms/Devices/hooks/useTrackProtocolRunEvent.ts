import { useTrackEvent } from '../../../redux/analytics'
import { useProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'

import type { AnalyticsEvent } from '../../../redux/analytics/types'

type TrackProtocolRunEvent = (event: AnalyticsEvent) => Promise<void>

export function useTrackProtocolRunEvent(
  runId: string | null
): { trackProtocolRunEvent: TrackProtocolRunEvent } {
  const trackEvent = useTrackEvent()
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(runId)

  const trackProtocolRunEvent = async (
    event: AnalyticsEvent
  ): Promise<void> => {
    try {
      const {
        protocolRunAnalyticsData,
        runTime,
      } = await getProtocolRunAnalyticsData()

      trackEvent({
        name: event.name,
        properties: {
          ...event.properties,
          ...protocolRunAnalyticsData,
          runTime,
        },
      })
    } catch (e: unknown) {
      console.error(
        `getProtocolRunAnalyticsData error during ${event.name}: ${
          (e as Error).message
        }; sending event without protocol properties`
      )

      trackEvent({
        name: event.name,
        properties: { ...event.properties },
      })
    }
  }

  return { trackProtocolRunEvent }
}
