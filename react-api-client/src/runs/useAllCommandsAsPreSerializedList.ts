import { UseQueryResult, useQuery } from 'react-query'
import { getCommandsAsPreSerializedList } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryOptions } from 'react-query'
import type {
  GetCommandsParams,
  HostConfig,
  CommandsData,
  RunCommandSummary,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30
export const DEFAULT_PARAMS: GetCommandsParams = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
}

export function useAllCommandsAsPreSerializedList<TError = Error>(
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
  // reduce hostKey into a new object to make nullish values play nicely with react-query key hash
  const hostKey =
    host != null
      ? Object.entries(host).reduce<Object>((acc, current) => {
          const [key, val] = current
          if (val != null) {
            return { ...acc, [key]: val }
          } else {
            return { ...acc, [key]: 'no value' }
          }
        }, {})
      : {}

  const query = useQuery<CommandsData, TError>(
    [
      hostKey,
      'runs',
      runId,
      'getCommandsAsPreSerializedList',
      cursor,
      pageLength,
    ],
    () => {
      return getCommandsAsPreSerializedList(
        host as HostConfig,
        runId as string,
        nullCheckedParams
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
