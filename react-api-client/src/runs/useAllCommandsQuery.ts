import { useQuery } from 'react-query'
import { getCommands } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  GetRunCommandsParamsRequest,
  HostConfig,
  CommandsData,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30
export const DEFAULT_PARAMS: GetRunCommandsParamsRequest = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
  includeFixitCommands: null,
}

export function useAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetRunCommandsParamsRequest | null,
  options: UseQueryOptions<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  const host = useHost()
  const nullCheckedParams = params ?? DEFAULT_PARAMS

  const allOptions: UseQueryOptions<CommandsData, TError> = {
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }
  const { cursor, pageLength } = nullCheckedParams
  const nullCheckedFixitCommands = params?.includeFixitCommands ?? null
  const finalizedNullCheckParams = {
    ...nullCheckedParams,
    includeFixitCommands: nullCheckedFixitCommands,
  }
  const query = useQuery<CommandsData, TError>(
    [
      host,
      'runs',
      runId,
      'commands',
      cursor,
      pageLength,
      finalizedNullCheckParams,
    ],
    () => {
      return getCommands(
        host as HostConfig,
        runId as string,
        finalizedNullCheckParams
      ).then(response => response.data)
    },
    allOptions
  )

  return query
}
