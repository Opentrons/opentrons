import {
  useAllSessionsQuery,
  useAllRunsQuery,
  useEstopQuery,
  useHost,
} from '@opentrons/react-api-client'
import { DISENGAGED } from '../../EmergencyStop'
import { useIsFlex } from './useIsFlex'

const ROBOT_STATUS_POLL_MS = 30000

interface UseIsRobotBusyOptions {
  poll: boolean
}
export function useIsRobotBusy(
  options: UseIsRobotBusyOptions = { poll: false }
): boolean {
  const { poll } = options
  const queryOptions = poll ? { refetchInterval: ROBOT_STATUS_POLL_MS } : {}
  const robotHasCurrentRun =
    useAllRunsQuery({}, queryOptions)?.data?.links?.current != null
  const allSessionsQueryResponse = useAllSessionsQuery(queryOptions)
  const host = useHost()
  const robotName = host?.robotName
  const isFlex = useIsFlex(robotName ?? '')
  const { data: estopStatus, error: estopError } = useEstopQuery({
    ...queryOptions,
    enabled: isFlex,
  })

  return (
    robotHasCurrentRun ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0) ||
    (isFlex && estopStatus?.data.status !== DISENGAGED && estopError == null)
  )
}
