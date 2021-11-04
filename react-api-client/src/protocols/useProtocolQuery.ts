import { UseQueryResult, useQuery } from 'react-query'
import { getProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Protocol } from '@opentrons/api-client'

export function useProtocolQuery(
  protocolId: string | null
): UseQueryResult<Protocol | null> {
  const host = useHost()
  const query = useQuery(
    [host, 'protocols', protocolId],
    () =>
      protocolId !== null
        ? getProtocol(host as HostConfig, protocolId).then(
            response => response.data
          )
        : null,
    { enabled: host !== null && protocolId !== null }
  )

  return query
}
