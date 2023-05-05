import { HostConfig, Run, getRun } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

import { useHost } from '../api'

export function useRunQuery<TError = Error>(
  runId: string | null,
  options: UseQueryOptions<Run, TError> = {}
): UseQueryResult<Run, TError> {
  const host = useHost()
  const query = useQuery<Run, TError>(
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
