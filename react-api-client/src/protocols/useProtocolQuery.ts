import { UseQueryResult, useQuery } from 'react-query'
import { getProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Protocol } from '@opentrons/api-client'
import type { UseQueryOptions } from 'react-query'

const POLLING_INTERVAL = 1000

export function useProtocolQuery(
  protocolId: string | null,
  options?: UseQueryOptions<Protocol | null>,
  enablePolling?: boolean
): UseQueryResult<Protocol | null> {
  const host = useHost()
  const allOptions: UseQueryOptions<Protocol | null> = {
    ...options,
    enabled:
      host !== null &&
      protocolId !== null &&
      (enablePolling == null || enablePolling),
    refetchInterval:
      enablePolling != null
        ? options?.refetchInterval ?? POLLING_INTERVAL
        : false,
  }
  const query = useQuery(
    [host, 'protocols', protocolId],
    () =>
      getProtocol(host as HostConfig, protocolId as string).then(
        response => response.data
      ),
    allOptions
  )

  return query
}
