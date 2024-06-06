import { getSessions } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, Sessions } from '@opentrons/api-client'

export function useAllSessionsQuery(
  options: UseQueryOptions<Sessions, Error> = {}
): UseQueryResult<Sessions, Error> {
  const host = useHost()
  const query = useQuery<Sessions, Error>(
    ['session', host],
    () =>
      getSessions(host as HostConfig)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
