import { UseQueryResult, useQuery } from 'react-query'
import { getCommandsAsPreSerializedList } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions } from 'react-query'
import type {
  GetCommandsParams,
  HostConfig,
  CommandsAsPreSerializedListData,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30
export const DEFAULT_PARAMS: GetCommandsParams = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
}

export function useAllCommandsAsPreSerializedList<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: UseQueryOptions<CommandsAsPreSerializedListData, TError> = {}
): UseQueryResult<CommandsAsPreSerializedListData, TError> {
  const host = useHost()
  const nullCheckedParams = params ?? DEFAULT_PARAMS

  const allOptions: UseQueryOptions<CommandsAsPreSerializedListData, TError> = {
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }
  const { cursor, pageLength } = nullCheckedParams
  const query = useQuery<CommandsAsPreSerializedListData, TError>(
    [host, 'runs', runId, 'getCommandsAsPreSerializedList', cursor, pageLength],
    () => {
      return getCommandsAsPreSerializedList(
        host as HostConfig,
        runId as string,
        nullCheckedParams
      ).then(response => response.data)
    },
    allOptions
  )

  return query
}
