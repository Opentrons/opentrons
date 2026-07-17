import { useQuery } from 'react-query'

import { getLights } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { Lights } from '@opentrons/api-client'

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
    getQueryKey(host, 'lights'),
    () => getLights(host!).then(response => response.data),
    allOptions
  )

  return query
}
