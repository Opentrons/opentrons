import { useQuery } from 'react-query'

import { getProtocolAnalyses } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ProtocolAnalyses } from '@opentrons/api-client'

const POLLING_INTERVAL = 1000

export function useProtocolAnalysesQuery(
  protocolId: string | null,
  options?: UseQueryOptions<ProtocolAnalyses>,
  enablePolling?: boolean
): UseQueryResult<ProtocolAnalyses | null> {
  const host = useHost()
  const allOptions: UseQueryOptions<ProtocolAnalyses> = {
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
  const query = useQuery<ProtocolAnalyses>(
    getQueryKey(host, 'protocols', protocolId, 'analyses'),
    () =>
      getProtocolAnalyses(host!, protocolId!).then(response => response.data),
    allOptions
  )

  return query
}
