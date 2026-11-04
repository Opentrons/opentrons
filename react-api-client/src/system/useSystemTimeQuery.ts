import { useQuery } from 'react-query'

import { getSystemTime } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, SystemTimeResponse } from '@opentrons/api-client'

export type UseSystemTimeQueryOptions = UseQueryOptions<SystemTimeResponse>

export function systemTimeQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'system', 'time')
}

export function useSystemTimeQuery(
  options: UseSystemTimeQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<SystemTimeResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    systemTimeQueryKey(host),
    () => getSystemTime(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
