import { useQuery } from 'react-query'

import { getSessions } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { Sessions } from '@opentrons/api-client'

export function useAllSessionsQuery(
  options: UseQueryOptions<Sessions, Error> = {}
): UseQueryResult<Sessions, Error> {
  const host = useHost()
  const query = useQuery<Sessions, Error>(
    getQueryKey(host, 'session'),
    () =>
      getSessions(host!)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
