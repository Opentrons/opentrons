import { HostConfig, Protocol, getProtocol } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useProtocolQuery(protocolId: string): UseQueryResult<Protocol> {
  const host = useHost()
  const query = useQuery(
    ['Protocol', host],
    () =>
      getProtocol(host as HostConfig, protocolId).then(
        response => response.data
      ),
    { enabled: host !== null }
  )

  return query
}
