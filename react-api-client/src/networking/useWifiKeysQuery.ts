import { useQuery } from 'react-query'

import { getWifiKeys } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, WifiKeysResponse } from '@opentrons/api-client'

export function useWifiKeysQuery(
  options: UseQueryOptions<WifiKeysResponse, Error> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<WifiKeysResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    wifiKeysQueryKey(host),
    () => getWifiKeys(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}

export function wifiKeysQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'networking', 'wifi', 'keys')
}
