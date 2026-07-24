import { INTERFACE_WIFI } from '@opentrons/api-client'
import { networkingStatusQueryKey } from '@opentrons/react-api-client'

import type { QueryClient } from 'react-query'
import type { HostConfig, NetworkingStatusResponse } from '@opentrons/api-client'

function getWifiInterfaceKey(
  networkingStatus: NetworkingStatusResponse | undefined
): string {
  const networkInterfacesEntries = Object.entries(
    networkingStatus?.interfaces ?? {}
  )
  const wifiInterfaceEntry = networkInterfacesEntries.find(
    networkInterface => networkInterface[1]?.type === INTERFACE_WIFI
  )
  // default to 'mlan0' for type safety (matches prior Redux reducer)
  return wifiInterfaceEntry?.[0] ?? 'mlan0'
}

export function clearWifiStatusInQueryCache(
  queryClient: QueryClient,
  host: HostConfig | null
): void {
  queryClient.setQueryData(
    networkingStatusQueryKey(host),
    (
      previous: NetworkingStatusResponse | undefined
    ): NetworkingStatusResponse => {
      const wifiInterfaceKey = getWifiInterfaceKey(previous)
      return {
        status: previous?.status ?? 'none',
        interfaces: {
          ...previous?.interfaces,
          [wifiInterfaceKey]: {
            ipAddress: null,
            macAddress: 'unknown',
            gatewayAddress: null,
            state: 'disconnected',
            type: INTERFACE_WIFI,
          },
        },
      }
    }
  )
}
