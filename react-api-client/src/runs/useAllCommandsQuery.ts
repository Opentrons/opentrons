import { UseQueryResult, useQuery } from 'react-query'
import { getCommands } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions } from 'react-query'
import type {
  GetCommandsParams,
  HostConfig,
  CommandsData,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30
export const DEFAULT_PARAMS: GetCommandsParams = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
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
  const { cursor, pageLength } = params
  const query = useQuery<CommandsData>(
    [host, 'runs', runId, 'commands', cursor, pageLength],
    () => {
      return getCommands(host as HostConfig, runId as string, params).then(
        response => response.data
      )
    },
    allOptions
  )

  return query
}
