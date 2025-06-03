import { useSelector } from 'react-redux'

import { useRobot } from '/app/redux-resources/robots'
import { useTrackEvent } from '/app/redux/analytics'
import { getAppLanguage } from '/app/redux/config'

import { useProtocolRunAnalyticsData } from './useProtocolRunAnalyticsData'

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
  const appLanguage = useSelector(getAppLanguage)
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
            // It's sometimes unavoidable (namely on the desktop app) to prevent sending an event multiple times.
            // In these circumstances, we need an idempotency key to accurately filter events in Mixpanel.
            transactionId: runId,
            appLanguage,
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
