import { useQuery } from 'react-query'
import { useAllSessionsQuery, useAllRunsQuery } from '@opentrons/react-api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useIsRobotBusy(
  options: UseQueryOptions<boolean> = {} // add initial value here
): UseQueryResult<boolean> {
  const { data: allRuns } = useAllRunsQuery(options)
  const currentRunLink = allRuns?.links?.current ?? null
  const robotHasCurrentRun = currentRunLink !== null
  const allSessionsQueryResponse = useAllSessionsQuery()
  const host = useHost()
  const query = useQuery<boolean>(
    ['setting', host],
    () => (robotHasCurrentRun ||
      (allSessionsQueryResponse?.data?.data != null &&
        allSessionsQueryResponse?.data?.data?.length !== 0))
  )
  return query
}
