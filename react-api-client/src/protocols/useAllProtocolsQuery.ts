import { HostConfig, Protocols, getProtocols } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useAllProtocolsQuery(): UseQueryResult<Protocols> {
  const host = useHost()
  const query = useQuery(
    ['protocols', host],
    () => getProtocols(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
