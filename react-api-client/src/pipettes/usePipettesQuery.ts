import { useQuery } from 'react-query'
import { getPipettes } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Pipettes } from '@opentrons/api-client'

export function usePipettesQuery(
  options: UseQueryOptions<Pipettes> = {}
): UseQueryResult<Pipettes> {
  const host = useHost()
  const query = useQuery<Pipettes>(
    [host, 'pipettes'],
    () => getPipettes(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
