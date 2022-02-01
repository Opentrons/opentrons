import { UseQueryResult, useQuery } from 'react-query'
import { HostConfig, CommandsData, getCommands } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions } from 'react-query'

const DEFAULT_REFETCH_INTERVAL = 10000 // 10 seconds
export function useAllCommandsQuery(
  runId: string | null,
  options: UseQueryOptions<CommandsData> = {}
): UseQueryResult<CommandsData> {
  const host = useHost()
  const allOptions: UseQueryOptions<CommandsData> = {
    enabled: host !== null && runId != null,
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
    ...options,
  }
  const query = useQuery<CommandsData>(
    [host, 'runs', runId, 'commands'],
    () =>
      getCommands(host as HostConfig, runId as string)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    allOptions
  )

  return query
}
