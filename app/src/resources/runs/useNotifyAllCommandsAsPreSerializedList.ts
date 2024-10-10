import { useAllCommandsAsPreSerializedList } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { AxiosError } from 'axios'
import type { CommandsData, GetRunCommandsParams } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export function useNotifyAllCommandsAsPreSerializedList(
  runId: string | null,
  params?: GetRunCommandsParams | null,
  options: QueryOptionsWithPolling<CommandsData, AxiosError> = {}
): UseQueryResult<CommandsData, AxiosError> {
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/runs/pre_serialized_commands/${runId}`,
    options,
  })

  const httpQueryResult = useAllCommandsAsPreSerializedList(
    runId,
    params,
    queryOptionsNotify
  )

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  return httpQueryResult
}
