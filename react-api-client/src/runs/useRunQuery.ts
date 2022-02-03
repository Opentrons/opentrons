import { HostConfig, Run, getRun } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useRunQuery(
  runId: string | null,
  options: UseQueryOptions<Run> = {}
): UseQueryResult<Run> {
  const host = useHost()
  const query = useQuery<Run>(
    [host, 'runs', runId, 'details'],
    () =>
      getRun(host as HostConfig, runId as string).then(
        response => response.data
      ),
    {
      ...options,
      enabled: host !== null && runId != null && options.enabled !== false,
    }
  )

  return query
}
