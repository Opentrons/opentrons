import { useQuery } from 'react-query'

import { getEstopStatus } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { EstopStatus } from '@opentrons/api-client'

export type UseEstopQueryOptions<TError = Error> = UseQueryOptions<
  EstopStatus,
  TError
>

export function useEstopQuery<TError = Error>(
  options: UseEstopQueryOptions<TError> = {}
): UseQueryResult<EstopStatus, TError> {
  const host = useHost()
  const query = useQuery<EstopStatus, TError>(
    getQueryKey(host, 'robot/control/estopStatus'),
    () => getEstopStatus(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
