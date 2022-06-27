import { useTrackEvent } from '../../../redux/analytics'
import { useProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'

interface ProtocolRunAnalyticsEvent {
  name: string
  properties: { [key: string]: unknown }
}

type TrackProtocolRunEvent = (
  protocolRunEvent: ProtocolRunAnalyticsEvent
) => Promise<void>

export function useTrackProtocolRunEvent(
  runId: string | null
): { trackProtocolRunEvent: TrackProtocolRunEvent } {
  const trackEvent = useTrackEvent()
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(runId)

  const trackProtocolRunEvent: TrackProtocolRunEvent = async protocolRunEvent => {
    try {
      const {
        protocolRunAnalyticsData,
        runTime,
      } = await getProtocolRunAnalyticsData()

      trackEvent({
        name: protocolRunEvent.name,
        properties: {
          ...protocolRunEvent.properties,
          ...protocolRunAnalyticsData,
          runTime,
        },
      })
    } catch (e: unknown) {
      console.error(
        `getProtocolRunAnalyticsData error during ${protocolRunEvent.name}: ${
          (e as Error).message
        }; sending protocolRunEvent without protocol properties`
      )

      trackEvent({
        name: protocolRunEvent.name,
        properties: { ...protocolRunEvent.properties },
      })
    }
  }

  return { trackProtocolRunEvent }
}
