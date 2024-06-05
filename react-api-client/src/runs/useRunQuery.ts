import { getRun } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Run } from '@opentrons/api-client'

export function useRunQuery<TError = Error>(
  runId: string | null,
  options: UseQueryOptions<Run, TError> = {}
): UseQueryResult<Run, TError> {
  const host = useHost()
  const query = useQuery<Run, TError>(
    [getSanitizedQueryKeyObject(host), 'runs', runId, 'details'],
    () =>
      getRun(host as HostConfig, runId as string).then(
        response => response.data
      ),
    {
      enabled: host !== null && runId != null && options.enabled !== false,
      ...options,
    }
  )

  return query
}
