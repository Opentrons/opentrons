import { UseQueryResult, useQuery } from 'react-query'
import { CommandDetail, HostConfig, getCommand } from '@opentrons/api-client'
import { useHost } from '../api'

export function useCommandQuery(
  sessionId: string,
  commandId: string
): UseQueryResult<CommandDetail, Error> {
  const host = useHost()
  const query = useQuery<CommandDetail, Error>(
    [host, 'runs', sessionId, 'commands', commandId],
    () =>
      getCommand(host as HostConfig, sessionId, commandId)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null && sessionId != null && commandId != null }
  )

  return query
}
