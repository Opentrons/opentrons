import { getConnections } from '@opentrons/api-client'
import type { ActiveConnections, HostConfig } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useConnectionsQuery(
  options: UseQueryOptions<ActiveConnections> = {}
): UseQueryResult<ActiveConnections> {
  const host = useHost()
  const query = useQuery<ActiveConnections>(
    [host, 'connections'],
    () => getConnections(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
