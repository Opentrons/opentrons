import { getInstruments } from '@opentrons/api-client'
import type { HostConfig, Instruments } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

import { useHost } from '../api'

export function useInstrumentsQuery(
  options: UseQueryOptions<Instruments> = {}
): UseQueryResult<Instruments> {
  const host = useHost()
  const query = useQuery<Instruments>(
    [host, 'instruments'],
    () => getInstruments(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
