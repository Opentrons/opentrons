import { UseQueryResult, useQuery } from 'react-query'
import { CommandDetail, HostConfig, getCommand } from '@opentrons/api-client'
import { useHost } from '../api'

export function useCommandQuery(
  runId: string,
  commandId: string
): UseQueryResult<CommandDetail, Error> {
  const host = useHost()
  const query = useQuery<CommandDetail, Error>(
    [host, 'runs', runId, 'commands', commandId],
    () =>
      getCommand(host as HostConfig, runId, commandId)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null && runId != null && commandId != null }
  )

  return query
}
