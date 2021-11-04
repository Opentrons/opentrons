import { getRuns, HostConfig, Runs, RunType } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment query callback body to mock
// import { mockRunsResponse } from './__fixtures__'

export function useRunsByTypeQuery(args: {
  runType: RunType
}): UseQueryResult<Runs> {
  const { runType } = args
  const host = useHost()
  const query = useQuery(
    [host, 'runs', runType],
    () =>
      getRuns(host as HostConfig, {
        run_type: runType,
      }).then(response => response.data),
    // Promise.resolve(mockRunsResponse),
    { enabled: host !== null, refetchInterval: 5000 }
  )

  return query
}
