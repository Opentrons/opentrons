import { getEstopStatus } from '@opentrons/api-client'
import type { EstopStatus, HostConfig } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export type UseEstopQueryOptions<TError = Error> = UseQueryOptions<
  EstopStatus,
  TError
>

export function useEstopQuery<TError = Error>(
  options: UseEstopQueryOptions<TError> = {}
): UseQueryResult<EstopStatus, TError> {
  const host = useHost()
  const query = useQuery<EstopStatus, TError>(
    [host as HostConfig, 'robot/control/estopStatus'],
    () => getEstopStatus(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
