import { useTrackEvent } from '../../../redux/analytics'
import { parseProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'
import { parseProtocolAnalysisOutput } from './useStoredProtocolAnalysis'

import type { StoredProtocolData } from '../../../redux/protocol-storage'

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

  const storedProtocolAnalysis = parseProtocolAnalysisOutput(
    protocol?.mostRecentAnalysis ?? null
  )

  const getProtocolRunAnalyticsData = parseProtocolRunAnalyticsData(
    storedProtocolAnalysis,
    protocol,
    null,
    robotName
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
