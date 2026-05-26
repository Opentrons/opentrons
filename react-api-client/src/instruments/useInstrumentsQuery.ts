import { useQuery } from 'react-query'

import { getInstruments } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { Instruments } from '@opentrons/api-client'

export function useInstrumentsQuery(
  options: UseQueryOptions<Instruments> = {}
): UseQueryResult<Instruments> {
  const host = useHost()
  const query = useQuery<Instruments>(
    getQueryKey(host, 'instruments'),
    () => getInstruments(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
