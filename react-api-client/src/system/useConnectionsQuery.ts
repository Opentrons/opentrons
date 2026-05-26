import { useQuery } from 'react-query'

import { getConnections } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ActiveConnections } from '@opentrons/api-client'

export function useConnectionsQuery(
  options: UseQueryOptions<ActiveConnections> = {}
): UseQueryResult<ActiveConnections> {
  const host = useHost()
  const query = useQuery<ActiveConnections>(
    getQueryKey(host, 'connections'),
    () => getConnections(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
