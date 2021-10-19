import { UseQueryResult, useQuery } from 'react-query'
import { HostConfig, Commands, getCommands } from '@opentrons/api-client'
import { useHost } from '../api'

export function useAllCommandsQuery(
  sessionId?: string
): UseQueryResult<Commands> {
  const host = useHost()
  const query = useQuery(
    ['session', host],
    () =>
      getCommands(host as HostConfig, sessionId as string).then(
        response => response.data
      ),
    { enabled: host !== null && sessionId != null }
  )

  return query
}
