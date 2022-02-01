import { UseQueryResult, useQuery } from 'react-query'
import { HostConfig, CommandsData, getCommands } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions } from 'react-query'
import { GetCommandsParams } from '@opentrons/api-client'

const DEFAULT_REFETCH_INTERVAL = 10000 // 10 seconds
const DEFAULT_WINDOW_OVERLAP = 30
export const DEFAULT_PARAMS: GetCommandsParams = {
  cursor: null,
  before: DEFAULT_WINDOW_OVERLAP,
  after: DEFAULT_WINDOW_OVERLAP,
}

export function useAllCommandsQuery(
  runId: string | null,
  params: GetCommandsParams = DEFAULT_PARAMS,
  options: UseQueryOptions<CommandsData> = {}
): UseQueryResult<CommandsData> {
  const host = useHost()
  const allOptions: UseQueryOptions<CommandsData> = {
    enabled: host !== null && runId != null,
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
    ...options,
  }
  const { cursor, before, after } = params
  const query = useQuery<CommandsData>(
    [host, 'runs', runId, 'commands', cursor, before, after],
    () =>
      getCommands(host as HostConfig, runId as string, params)
        .then(response => response.data)
        .catch((e: Error) => {
          throw e
        }),
    allOptions
  )

  return query
}
