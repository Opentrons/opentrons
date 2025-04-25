import { useQuery } from 'react-query'

import { getCommands } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  CommandsData,
  GetRunCommandsParamsRequest,
  HostConfig,
} from '@opentrons/api-client'

const DEFAULT_PAGE_LENGTH = 30

export function useAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetRunCommandsParamsRequest,
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
    [host, 'runs', runId, 'commands', cursor, pageLength, includeFixitCommands],
    () => {
      return getCommands(
        host as HostConfig,
        runId as string,
        finalizedParams
      ).then(response => response.data)
    },
    allOptions
  )

  return query
}
