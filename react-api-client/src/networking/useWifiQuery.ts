import { useQuery } from 'react-query'

import { getWifiList } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, WifiListResponse } from '@opentrons/api-client'

export function useWifiQuery(
  options: UseQueryOptions<WifiListResponse, Error> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<WifiListResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    getQueryKey(host, 'networking', 'wifi'),
    () => getWifiList(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
