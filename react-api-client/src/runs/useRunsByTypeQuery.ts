import { getRuns, HostConfig, Runs, RunType } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useRunsByTypeQuery(args: {
  runType: RunType
}): UseQueryResult<Runs> {
  const { runType } = args
  const host = useHost()
  const query = useQuery(
    ['run', host],
    () =>
      getRuns(host as HostConfig, {
        run_type: runType,
      }).then(response => response.data),
    { enabled: host !== null, refetchInterval: 5000 }
  )

  return query
}
