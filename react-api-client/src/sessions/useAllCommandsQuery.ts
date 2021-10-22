import { UseQueryResult, useQuery } from 'react-query'
import { HostConfig, Commands, getCommands } from '@opentrons/api-client'
import { useHost } from '../api'

export function useAllCommandsQuery(
  sessionId?: string
): UseQueryResult<Commands, Error> {
  const host = useHost()
  const query = useQuery<Commands, Error>(
    ['session', sessionId, 'commands', host],
    () =>
      getCommands(host as HostConfig, sessionId as string)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null && sessionId != null }
  )

  return query
}
