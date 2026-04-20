import { useQuery } from 'react-query'

import { getRuns } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  GetRunsParams,
  HostConfig,
  HttpClientError,
  Runs,
} from '@opentrons/api-client'

export type UseAllRunsQueryOptions = UseQueryOptions<
  Runs,
  HttpClientError,
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
): UseQueryResult<Runs, HttpClientError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  let queryKey = [host!, 'runs', 'details']
  if (params?.pageLength != null) {
    queryKey = [...queryKey, String(params.pageLength)]
  }
  const query = useQuery(
    queryKey,
    () =>
      getRuns(host!, params)
        .then(response => response.data)
        .catch((e: HttpClientError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
