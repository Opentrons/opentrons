import { useQuery } from 'react-query'

import { getEstopStatus } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { EstopStatus, HostConfig } from '@opentrons/api-client'

export type UseEstopQueryOptions<TError = Error> = UseQueryOptions<
  EstopStatus,
  TError
>

export function useEstopQuery<TError = Error>(
  options: UseEstopQueryOptions<TError> = {}
): UseQueryResult<EstopStatus, TError> {
  const host = useHost()
  const query = useQuery<EstopStatus, TError>(
    [host!, 'robot/control/estopStatus'],
    () => getEstopStatus(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
