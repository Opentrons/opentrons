import { useQuery } from 'react-query'

import { getNetworkingStatus } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, NetworkingStatusResponse } from '@opentrons/api-client'

export type UseNetworkingStatusQueryOptions =
  UseQueryOptions<NetworkingStatusResponse>

export function networkingStatusQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'networking', 'status')
}

export function useNetworkingStatusQuery(
  options: UseNetworkingStatusQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<NetworkingStatusResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    networkingStatusQueryKey(host),
    () => getNetworkingStatus(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
