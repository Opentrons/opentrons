import { useAllCommandsQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type {
  CommandsData,
  GetRunCommandsParams,
  GetCommandsParams,
} from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

const DEFAULT_PAGE_LENGTH = 30

export const DEFAULT_PARAMS: GetCommandsParams = {
  cursor: null,
  pageLength: DEFAULT_PAGE_LENGTH,
}

export function useNotifyAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetRunCommandsParams | null,
  options: QueryOptionsWithPolling<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  // Assume the useAllCommandsQuery() response can only change when the command links change.
  //
  // TODO(mm, 2024-05-21): I don't think this is correct. If a command goes from
  // running to succeeded, that may change the useAllCommandsQuery response, but it
  // will not necessarily change the command links. We might need an MQTT topic
  // covering "any change in `GET /runs/{id}/commands`".
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: 'robot-server/runs/commands_links',
    options,
  })
  const nullCheckedParams = params ?? DEFAULT_PARAMS

  const nullCheckedFixitCommands = params?.includeFixitCommands ?? null
  const finalizedNullCheckParams = {
    ...nullCheckedParams,
    includeFixitCommands: nullCheckedFixitCommands,
  }

  const httpQueryResult = useAllCommandsQuery(
    runId,
    finalizedNullCheckParams,
    queryOptionsNotify
  )

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  return httpQueryResult
}
