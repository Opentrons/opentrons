import { UseQueryResult, useQuery } from 'react-query'
import { getProtocols } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Protocols } from '@opentrons/api-client'

export function useAllProtocolsQuery(): UseQueryResult<Protocols> {
  const host = useHost()
  const query = useQuery(
    ['protocols', host],
    () => getProtocols(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
