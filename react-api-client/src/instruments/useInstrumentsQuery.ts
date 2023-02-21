import { useQuery } from 'react-query'
import { getInstruments } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Instruments } from '@opentrons/api-client'

export function useInstrumentsQuery(
  options: UseQueryOptions<Instruments> = {},
  refresh: boolean = false
): UseQueryResult<Instruments> {
  const host = useHost()
  const query = useQuery<Instruments>(
    [host, 'instruments'],
    () => getInstruments(host as HostConfig, { refresh }).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
