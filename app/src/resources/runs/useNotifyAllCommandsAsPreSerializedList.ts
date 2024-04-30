import * as React from 'react'

import { useAllCommandsAsPreSerializedList } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { AxiosError } from 'axios'
import type { CommandsData, GetCommandsParams } from '@opentrons/api-client'
import type {
  QueryOptionsWithPolling,
  HTTPRefetchFrequency,
} from '../useNotifyService'

export function useNotifyAllCommandsAsPreSerializedList(
  runId: string | null,
  params?: GetCommandsParams | null,
  options: QueryOptionsWithPolling<CommandsData, AxiosError> = {}
): UseQueryResult<CommandsData, AxiosError> {
  const [refetch, setRefetch] = React.useState<HTTPRefetchFrequency>(null)

  useNotifyService<CommandsData, AxiosError>({
    topic: `robot-server/runs/${runId}/pre_serialized_commands`,
    setRefetch,
    options,
  })

  const httpResponse = useAllCommandsAsPreSerializedList(runId, params, {
    ...options,
    enabled: options?.enabled !== false && refetch != null,
    onSettled: refetch === 'once' ? () => setRefetch(null) : () => null,
  })

  return httpResponse
}
