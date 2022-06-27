import { useTrackEvent } from '../../../redux/analytics'
import { useProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'

interface ProtocolRunAnalyticsEvent {
  name: string
  properties?: { [key: string]: unknown }
}

type TrackProtocolRunEvent = (
  protocolRunEvent: ProtocolRunAnalyticsEvent
) => void

export function useTrackProtocolRunEvent(
  runId: string | null
): { trackProtocolRunEvent: TrackProtocolRunEvent } {
  const trackEvent = useTrackEvent()
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(runId)

  const trackProtocolRunEvent: TrackProtocolRunEvent = ({
    name,
    properties = {},
  }) => {
    getProtocolRunAnalyticsData()
      .then(({ protocolRunAnalyticsData, runTime }) => {
        trackEvent({
          name,
          properties: {
            ...properties,
            ...protocolRunAnalyticsData,
            runTime,
          },
        })
      })
      .catch((e: Error) => {
        console.error(
          `getProtocolRunAnalyticsData error during ${name}: ${e.message}; sending protocolRunEvent without protocol properties`
        )
        trackEvent({ name, properties: {} })
      })
  }

  return { trackProtocolRunEvent }
}
