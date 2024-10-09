import { useTrackEvent } from '/app/redux/analytics'
import { parseProtocolRunAnalyticsData } from '/app/transformations/analytics'
import { parseProtocolAnalysisOutput } from '/app/transformations/analysis'

import type { StoredProtocolData } from '/app/redux/protocol-storage'
import { useRobot } from '/app/redux-resources/robots'

type CreateProtocolRunEventName =
  | 'createProtocolRecordRequest'
  | 'createProtocolRecordResponse'

interface CreateProtocolRunAnalyticsEvent {
  name: CreateProtocolRunEventName
  properties?: { [key: string]: unknown }
}

type TrackCreateProtocolRunEvent = (
  createProtocolRunEvent: CreateProtocolRunAnalyticsEvent
) => void

export function useTrackCreateProtocolRunEvent(
  protocol: StoredProtocolData | null,
  robotName: string
): { trackCreateProtocolRunEvent: TrackCreateProtocolRunEvent } {
  const trackEvent = useTrackEvent()

  const robot = useRobot(robotName)

  const storedProtocolAnalysis = parseProtocolAnalysisOutput(
    protocol?.mostRecentAnalysis ?? null
  )

  const getProtocolRunAnalyticsData = parseProtocolRunAnalyticsData(
    storedProtocolAnalysis,
    protocol,
    null,
    robot
  )

  const trackCreateProtocolRunEvent: TrackCreateProtocolRunEvent = ({
    name,
    properties = {},
  }) => {
    getProtocolRunAnalyticsData()
      .then(({ protocolRunAnalyticsData }) => {
        trackEvent({
          name,
          properties: {
            ...properties,
            ...protocolRunAnalyticsData,
          },
        })
      })
      .catch((e: Error) => {
        console.error(
          `getProtocolRunAnalyticsData error during ${name}: ${e.message}; sending createProtocolRunEvent without protocol properties`
        )
        trackEvent({
          name,
          properties: {
            error: `getProtocolRunAnalyticsData error during ${name}: ${e.message}`,
          },
        })
      })
  }

  return { trackCreateProtocolRunEvent }
}
