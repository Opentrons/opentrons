import { useQuery } from 'react-query'
import { getConnections } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ActiveConnections, HostConfig } from '@opentrons/api-client'

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
