import { useQuery } from 'react-query'
import { getEstopStatus } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, EstopStatus } from '@opentrons/api-client'

export function useEstopQuery<TError = Error>(
  options: UseQueryOptions<EstopStatus, TError> = {}
): UseQueryResult<EstopStatus, TError> {
  const host = useHost()
  const query = useQuery<EstopStatus, TError>(
    [host as HostConfig, 'robot/control/estopStatus'],
    () => getEstopStatus(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
