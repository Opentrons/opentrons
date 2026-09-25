import { useQuery } from 'react-query'

import { getProtocol } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { Protocol } from '@opentrons/api-client'

const POLLING_INTERVAL = 1000

export function useProtocolQuery(
  protocolId: string | null,
  options?: UseQueryOptions<Protocol>,
  enablePolling?: boolean
): UseQueryResult<Protocol | null> {
  const host = useHost()
  const allOptions: UseQueryOptions<Protocol> = {
    ...options,
    enabled:
      host !== null &&
      protocolId != null &&
      (enablePolling == null || enablePolling),
    refetchInterval:
      enablePolling != null
        ? (options?.refetchInterval ?? POLLING_INTERVAL)
        : false,
  }
  const query = useQuery<Protocol>(
    getQueryKey(host, 'protocols', protocolId),
    () => getProtocol(host!, protocolId!).then(response => response.data),
    allOptions
  )

  return query
}
