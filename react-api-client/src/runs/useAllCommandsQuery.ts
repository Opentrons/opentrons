import { UseQueryResult, useQuery } from 'react-query'
import { getCommands } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions } from 'react-query'
import type {
  GetCommandsParams,
  HostConfig,
  CommandsData,
} from '@opentrons/api-client'

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
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }
  const { cursor, before, after } = params
  const query = useQuery<CommandsData>(
    [host, 'runs', runId, 'commands', cursor, before, after],
    () => {
      return getCommands(host as HostConfig, runId as string, params).then(
        response => response.data
      )
    },
    allOptions
  )

  return query
}
