import { HostConfig, Run, getRun } from '@opentrons/api-client'
import { UseQueryResult, useQuery } from 'react-query'
import { useHost } from '../api'

export function useRunQuery(sessionId: string): UseQueryResult<Run> {
  const host = useHost()
  const query = useQuery(
    ['session', host],
    () => getRun(host as HostConfig, sessionId).then(response => response.data),
    { enabled: host !== null }
  )

  return query
}
