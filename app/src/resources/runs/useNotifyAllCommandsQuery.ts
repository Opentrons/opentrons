import { useAllCommandsQuery } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { CommandsData, GetCommandsParams } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyAllCommandsQuery<TError = Error>(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: QueryOptionsWithPolling<CommandsData, TError> = {}
): UseQueryResult<CommandsData, TError> {
  const { notifyOnSettled, shouldRefetch } = useNotifyService({
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
