import { HostConfig, Runs, getRuns } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'

export function useAllRunsQuery(
  options: UseQueryOptions<Runs, Error, Runs, Array<string | HostConfig>> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Runs> {
  const contextHost = useHost()
  const host = hostOverride ?? contextHost
  const query = useQuery(
    [host as HostConfig, 'runs', 'details'],
    () => getRuns(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
