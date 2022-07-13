import { HostConfig, Runs, getRuns } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryOptions } from 'react-query'

export function useAllRunsQuery(
  options: UseQueryOptions<Runs, Error> = {}
): UseQueryResult<Runs, Error> {
  const host = useHost()
  const query = useQuery(
    [host, 'runs', 'details'],
    () => getRuns(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
