import { useQuery } from 'react-query'

import { getProtocolIds } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ProtocolsIds } from '@opentrons/api-client'

const POLLING_INTERVAL = 1000

export function useAllProtocolIdsQuery(
  options?: UseQueryOptions<ProtocolsIds>,
  enablePolling?: boolean
): UseQueryResult<ProtocolsIds | null> {
  const host = useHost()
  const allOptions: UseQueryOptions<ProtocolsIds> = {
    ...options,
    enabled: host !== null && (enablePolling == null || enablePolling),
    refetchInterval:
      enablePolling != null
        ? (options?.refetchInterval ?? POLLING_INTERVAL)
        : false,
  }
  const query = useQuery<ProtocolsIds>(
    getQueryKey(host, 'protocols', 'ids'),
    () => getProtocolIds(host!).then(response => response.data),
    allOptions
  )

  return query
}
