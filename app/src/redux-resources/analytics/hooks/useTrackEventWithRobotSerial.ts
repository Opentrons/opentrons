import { useSelector } from 'react-redux'
import { useTrackEvent } from '/app/redux/analytics'
import { getLocalRobot, getRobotSerialNumber } from '/app/redux/discovery'

interface AnalyticsEvent {
  name: string
  properties: { [key: string]: unknown }
}

export type TrackEventWithRobotSerial = (event: AnalyticsEvent) => void

export function useTrackEventWithRobotSerial(): {
  trackEventWithRobotSerial: TrackEventWithRobotSerial
} {
  const trackEvent = useTrackEvent()
  const localRobot = useSelector(getLocalRobot)
  const robotSerialNumber =
    localRobot?.status != null ? getRobotSerialNumber(localRobot) : null
  const trackEventWithRobotSerial: TrackEventWithRobotSerial = ({
    name,
    properties,
  }) => {
    trackEvent({
      name,
      properties: {
        ...properties,
        robotSerial: robotSerialNumber,
      },
    })
  }

  return { trackEventWithRobotSerial }
}
