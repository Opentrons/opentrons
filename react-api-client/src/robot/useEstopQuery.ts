import { useQuery } from 'react-query'
import { getEstopStatus } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, EstopStatus } from '@opentrons/api-client'

export type UseEstopQueryOptions<TError = Error> = UseQueryOptions<
  EstopStatus,
  TError
>

export function useEstopQuery<TError = Error>(
  options: UseEstopQueryOptions<TError> = {}
): UseQueryResult<EstopStatus, TError> {
  const host = useHost()
  const query = useQuery<EstopStatus, TError>(
    [
      getSanitizedQueryKeyObject(host) as HostConfig,
      'robot/control/estopStatus',
    ],
    () => getEstopStatus(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
