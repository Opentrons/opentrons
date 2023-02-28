import { HostConfig, Lights, getLights } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useLightsQuery<TError = Error>(
  options: UseQueryOptions<Lights, TError> = {}
): UseQueryResult<Lights, TError> {
  const host = useHost()
  const allOptions: UseQueryOptions<Lights, TError> = {
    ...options,
    enabled: host !== null && options.enabled !== false,
  }
  const query = useQuery<Lights, TError>(
    [host as HostConfig, 'lights'],
    () => getLights(host as HostConfig).then(response => response.data),
    allOptions
  )

  return query
}
