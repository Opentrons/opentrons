import { UseQueryResult, useQuery } from 'react-query'
import { HostConfig, CommandsData, getCommands } from '@opentrons/api-client'
import { useHost } from '../api'

export function useAllCommandsQuery(
  runId?: string
): UseQueryResult<CommandsData, Error> {
  const host = useHost()
  const query = useQuery<CommandsData, Error>(
    [host, 'runs', runId, 'commands'],
    () =>
      getCommands(host as HostConfig, runId as string)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    { enabled: host !== null && runId != null, refetchInterval: 1000 }
  )

  return query
}
