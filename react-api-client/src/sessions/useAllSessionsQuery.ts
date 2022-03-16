import { HostConfig, Sessions, getSessions } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useAllSessionsQuery(): UseQueryResult<Sessions, Error> {
  const host = useHost()
  const query = useQuery<Sessions, Error>(
    ['session', host],
    () =>
      getSessions(host as HostConfig)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null }
  )

  return query
}
