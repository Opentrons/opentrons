import { getProtocol } from '@opentrons/api-client'
import type { HostConfig, Protocol } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import type { UseQueryOptions } from 'react-query'

import { useHost } from '../api'

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
        ? options?.refetchInterval ?? POLLING_INTERVAL
        : false,
  }
  const query = useQuery<Protocol>(
    [host, 'protocols', protocolId],
    () =>
      getProtocol(host as HostConfig, protocolId as string).then(
        response => response.data
      ),
    allOptions
  )

  return query
}
