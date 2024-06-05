import { useQuery } from 'react-query'
import { getProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { HostConfig, Protocol } from '@opentrons/api-client'
import type { UseQueryOptions, UseQueryResult } from 'react-query'

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
    [getSanitizedQueryKeyObject(host), 'protocols', protocolId],
    () =>
      getProtocol(host as HostConfig, protocolId as string).then(
        response => response.data
      ),
    allOptions
  )

  return query
}
