import { HostConfig, Run, getRun } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment query callback to mock
// import { mockProtocolRunResponse } from './__fixtures__'

export function useRunQuery(runId: string | null): UseQueryResult<Run | null> {
  const host = useHost()
  const query = useQuery(
    [host, 'runs', runId],
    () =>
      getRun(host as HostConfig, runId as string).then(
        response => response.data
      ),
    { enabled: host !== null && runId !== null }
  )

  return query
}
