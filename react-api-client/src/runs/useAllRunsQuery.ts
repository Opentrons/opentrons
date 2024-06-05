import { getRuns } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AxiosError } from 'axios'
import type { GetRunsParams, HostConfig, Runs } from '@opentrons/api-client'

export type UseAllRunsQueryOptions = UseQueryOptions<
  Runs,
  AxiosError,
  Runs,
  Array<string | HostConfig>
>

/**
 * @property {HostConfig | null | undefined} hostOverride:
 * When using all runs query outside of the host context provider, we must specify the host manually.
 */
export function useAllRunsQuery(
  params: GetRunsParams = {},
  options: UseAllRunsQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Runs, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  let queryKey = [
    getSanitizedQueryKeyObject(host) as HostConfig,
    'runs',
    'details',
  ]
  if (params?.pageLength != null) {
    queryKey = [...queryKey, String(params.pageLength)]
  }
  const query = useQuery(
    queryKey,
    () =>
      getRuns(host as HostConfig, params)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
