import { useQuery } from 'react-query'

import { getCommandsAsPreSerializedList } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  CommandsData,
  GetRunCommandsParams,
  RunCommandSummary,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30

export function useAllCommandsAsPreSerializedList<TError = Error>(
  runId: string | null,
  params?: GetRunCommandsParams | null,
  options: UseQueryOptions<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  const host = useHost()

  const allOptions: UseQueryOptions<CommandsData, TError> = {
    ...options,
    enabled: host !== null && runId != null && options.enabled !== false,
  }
  const { cursor, pageLength, includeFixitCommands } = params ?? {}
  const finalizedParams = {
    ...params,
    pageLength: params?.pageLength ?? DEFAULT_PAGE_LENGTH,
  }

  const query = useQuery<CommandsData, TError>(
    getQueryKey(
      host,
      'runs',
      runId,
      'getCommandsAsPreSerializedList',
      cursor,
      pageLength,
      includeFixitCommands
    ),
    () => {
      return getCommandsAsPreSerializedList(
        host!,
        runId!,
        finalizedParams
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
