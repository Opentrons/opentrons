import { useRunQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { Run, HostConfig } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'
import type { NotifyTopic } from '/app/redux/shell/types'

export function useNotifyRunQuery<TError = Error>(
  runId: string | null,
  options: QueryOptionsWithPolling<Run, TError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Run, TError> {
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/runs/${runId}` as NotifyTopic,
    options,
    hostOverride,
  })

  const httpQueryResult = useRunQuery(runId, queryOptionsNotify, hostOverride)

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  return httpQueryResult
}
