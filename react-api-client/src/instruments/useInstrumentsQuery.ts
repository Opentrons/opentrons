import { useQuery } from 'react-query'
import { getInstruments } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'

export function useInstrumentsQuery(
  options: UseQueryOptions<any> = {}
): UseQueryResult<any> {
  const host = useHost()
  const query = useQuery<any>(
    [host, 'instruments'],
    () => getInstruments(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
