import { useTrackEvent } from '../../../redux/analytics'
import { useProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'
import { useRobot } from './useRobot'

interface ProtocolRunAnalyticsEvent {
  name: string
  properties?: { [key: string]: unknown }
}

export type TrackProtocolRunEvent = (
  protocolRunEvent: ProtocolRunAnalyticsEvent
) => void

export function useTrackProtocolRunEvent(
  runId: string | null,
  robotName: string
): { trackProtocolRunEvent: TrackProtocolRunEvent } {
  const trackEvent = useTrackEvent()
  const robot = useRobot(robotName)
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(
    runId,
    robot
  )

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
