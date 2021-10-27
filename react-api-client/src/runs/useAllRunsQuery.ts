import { HostConfig, Runs, getRuns } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useAllRunsQuery(): UseQueryResult<Runs> {
  const host = useHost()
  const query = useQuery(
    ['run', host],
    () => getRuns(host as HostConfig).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
