import { HostConfig, EstopStatus, getEstopStatus } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useEstopQuery<TError = Error>(
  options: UseQueryOptions<EstopStatus, TError> = {}
): UseQueryResult<EstopStatus, TError> {
  const host = useHost()
  const allOptions: UseQueryOptions<EstopStatus, TError> = {
    ...options,
    enabled: host !== null && options.enabled !== false,
  }
  const query = useQuery<EstopStatus, TError>(
    [host as HostConfig, 'robot/control/estopStatus'],
    () => getEstopStatus(host as HostConfig).then(response => response.data),
    allOptions
  )

  return query
}
