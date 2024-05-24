import { useAllCommandsQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { CommandsData, GetCommandsParams } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: QueryOptionsWithPolling<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  const { notifyOnSettled, shouldRefetch } = useNotifyDataReady({
    topic: 'robot-server/runs/current_command', // only updates to the current command cause all commands to change
    options,
  })

  const httpResponse = useAllCommandsQuery(runId, params, {
    ...options,
    enabled: options?.enabled !== false && shouldRefetch,
    onSettled: notifyOnSettled,
  })

  return httpResponse
}
