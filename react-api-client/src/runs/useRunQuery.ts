import { HostConfig, Run, getRun } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useRunQuery(
  runId: string | null,
  options?: UseQueryOptions<Run | null>
): UseQueryResult<Run | null> {
  const host = useHost()
  const query = useQuery(
    [host, 'runs', runId],
    () =>
      getRun(host as HostConfig, runId as string).then(
        response => response.data
      ),
    {
      enabled: host !== null && runId != null,
      ...options,
    }
  )

  return query
}
