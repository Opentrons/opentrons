import {
  useAllSessionsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

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
  return (
    robotHasCurrentRun ||
    (allSessionsQueryResponse?.data?.data != null &&
      allSessionsQueryResponse?.data?.data?.length !== 0)
  )
}
