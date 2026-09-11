import { useQuery } from 'react-query'

import { getWifiList } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, WifiListResponse } from '@opentrons/api-client'

export function wifiQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'networking', 'wifi')
}

export function useWifiQuery(
  options: UseQueryOptions<WifiListResponse, Error> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<WifiListResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    wifiQueryKey(host),
    () => getWifiList(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
