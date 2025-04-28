import { getWifiList } from '@opentrons/api-client'
import type { HostConfig, WifiListResponse } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useWifiQuery(
  options: UseQueryOptions<
    WifiListResponse,
    Error,
    WifiListResponse,
    Array<string | HostConfig>
  > = {},
  hostOverride?: HostConfig | null
): UseQueryResult<WifiListResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    [host as HostConfig, 'networking', 'wifi'],
    () => getWifiList(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
