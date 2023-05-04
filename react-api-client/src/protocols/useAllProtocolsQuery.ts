import { useHost } from '../api'
import { getProtocols } from '@opentrons/api-client'
import type { HostConfig, Protocols } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'

export function useAllProtocolsQuery(): UseQueryResult<Protocols> {
  const host = useHost()
  const query = useQuery(
    [host, 'protocols'],
    () => getProtocols(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
