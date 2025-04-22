import { useQuery } from 'react-query'
import { getLights } from '@opentrons/api-client'

import { useHost } from '../api'

import type { HostConfig, Lights } from '@opentrons/api-client'
import type { UseQueryOptions, UseQueryResult } from 'react-query'

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
    [host as HostConfig, 'lights'],
    () => getLights(host as HostConfig).then(response => response.data),
    allOptions
  )

  return query
}
