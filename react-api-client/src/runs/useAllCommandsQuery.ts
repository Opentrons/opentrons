import { useQuery } from 'react-query'
import { getCommands } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
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

export function useAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: UseQueryOptions<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  const host = useHost()
  const nullCheckedParams = params ?? DEFAULT_PARAMS

  const allOptions: UseQueryOptions<CommandsData, TError> = {
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }
  const { cursor, pageLength } = nullCheckedParams
  const query = useQuery<CommandsData, TError>(
    [host, 'runs', runId, 'commands', cursor, pageLength],
    () => {
      return getCommands(
        host as HostConfig,
        runId as string,
        nullCheckedParams
      ).then(response => response.data)
    },
    allOptions
  )

  return query
}
