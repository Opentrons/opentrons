import { useQuery } from 'react-query'
import { getProtocolIds } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { HostConfig, ProtocolsIds } from '@opentrons/api-client'
import type { UseQueryOptions, UseQueryResult } from 'react-query'

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
        ? options?.refetchInterval ?? POLLING_INTERVAL
        : false,
  }
  const query = useQuery<ProtocolsIds>(
    [getSanitizedQueryKeyObject(host), 'protocols', 'ids'],
    () => getProtocolIds(host as HostConfig).then(response => response.data),
    allOptions
  )

  return query
}
