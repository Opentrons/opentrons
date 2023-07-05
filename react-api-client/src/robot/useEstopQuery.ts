import { HostConfig, EstopState, getEstopState } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useEstopQuery<TError = Error>(
  options: UseQueryOptions<EstopState, TError> = {}
): UseQueryResult<EstopState, TError> {
  const host = useHost()
  const allOptions: UseQueryOptions<EstopState, TError> = {
    ...options,
    enabled: host !== null && options.enabled !== false,
  }
  const query = useQuery<EstopState, TError>(
    [host as HostConfig, 'lights'],
    () => getEstopState(host as HostConfig).then(response => response.data),
    allOptions
  )

  return query
}
