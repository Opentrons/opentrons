import { useQuery } from 'react-query'
import { getDoorStatus } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, DoorStatus } from '@opentrons/api-client'

export type UseDoorQueryOptions<TError = Error> = UseQueryOptions<
  DoorStatus,
  TError
>

export function useDoorQuery<TError = Error>(
  options: UseDoorQueryOptions<TError> = {}
): UseQueryResult<DoorStatus, TError> {
  const host = useHost()
  const query = useQuery<DoorStatus, TError>(
    [host as HostConfig, '/robot/door/status'],
    () => getDoorStatus(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
