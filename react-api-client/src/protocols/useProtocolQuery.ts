import { UseQueryResult, useQuery } from 'react-query'
import { getProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Protocol } from '@opentrons/api-client'

export function useProtocolQuery(protocolId: string): UseQueryResult<Protocol> {
  const host = useHost()
  const query = useQuery(
    [host, 'protocols', protocolId],
    () =>
      getProtocol(host as HostConfig, protocolId).then(
        response => response.data
      ),
    { enabled: host !== null }
  )

  return query
}
