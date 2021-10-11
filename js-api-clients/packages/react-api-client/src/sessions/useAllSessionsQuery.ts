import { HostConfig, Sessions, getSessions } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useAllSessionsQuery(): UseQueryResult<Sessions> {
  const host = useHost()
  const query = useQuery(
    ['session', host],
    () => getSessions(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
