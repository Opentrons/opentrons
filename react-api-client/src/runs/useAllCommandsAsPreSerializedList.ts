import mapValues from 'lodash/mapValues'
import { useQuery } from 'react-query'

import { getCommandsAsPreSerializedList } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  GetRunCommandsParams,
  HostConfig,
  CommandsData,
  RunCommandSummary,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30
export const DEFAULT_PARAMS: GetRunCommandsParams = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
}

export function useAllCommandsAsPreSerializedList<TError = Error>(
  runId: string | null,
  params?: GetRunCommandsParams | null,
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

  // map undefined values to null to agree with react query caching
  // TODO (nd: 05/15/2024) create sanitizer for react query key objects
  const hostKey = mapValues(host, v => (v !== undefined ? v : null))

  const query = useQuery<CommandsData, TError>(
    [
      hostKey,
      'runs',
      runId,
      'getCommandsAsPreSerializedList',
      cursor,
      pageLength,
      nullCheckedFixitCommands,
    ],
    () => {
      return getCommandsAsPreSerializedList(
        host as HostConfig,
        runId as string,
        finalizedNullCheckParams
      ).then(response => {
        const responseData = response.data
        return {
          ...responseData,
          data: responseData.data.map(
            command => JSON.parse(command) as RunCommandSummary
          ),
        }
      })
    },
    allOptions
  )

  return query
}
