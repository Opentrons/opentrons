import { useQuery } from 'react-query'

import { getDoorStatus } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { DoorStatus } from '@opentrons/api-client'

export type UseDoorQueryOptions<TError = Error> = UseQueryOptions<
  DoorStatus,
  TError
>

export function useDoorQuery<TError = Error>(
  options: UseDoorQueryOptions<TError> = {}
): UseQueryResult<DoorStatus, TError> {
  const host = useHost()
  const query = useQuery<DoorStatus, TError>(
    getQueryKey(host, '/robot/door/status'),
    () => getDoorStatus(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
