import { useQuery } from 'react-query'
import { getProtocolAnalyses } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, ProtocolAnalyses } from '@opentrons/api-client'
import type { UseQueryOptions, UseQueryResult } from 'react-query'

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
        ? options?.refetchInterval ?? POLLING_INTERVAL
        : false,
  }
  const query = useQuery<ProtocolAnalyses>(
    [host, 'protocols', protocolId, 'analyses'],
    () =>
      getProtocolAnalyses(host as HostConfig, protocolId as string).then(
        response => response.data
      ),
    allOptions
  )

  return query
}
