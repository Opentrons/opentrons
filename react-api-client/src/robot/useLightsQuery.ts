import { getLights } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Lights } from '@opentrons/api-client'

export type UseLightsQueryOptions<TError = Error> = UseQueryOptions<
  Lights,
  TError
>

export function useLightsQuery<TError = Error>(
  options: UseLightsQueryOptions<TError> = {}
): UseQueryResult<Lights, TError> {
  const host = useHost()
  const allOptions: UseQueryOptions<Lights, TError> = {
    ...options,
    enabled: host !== null && options.enabled !== false,
  }
  const query = useQuery<Lights, TError>(
    [getSanitizedQueryKeyObject(host) as HostConfig, 'lights'],
    () => getLights(host as HostConfig).then(response => response.data),
    allOptions
  )

  return query
}
