import { useQuery } from 'react-query'
import { WifiListResponse, getWifiList } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'

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
