import { useRunQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'
import type { NotifyTopic } from '../../redux/shell/types'

export function useNotifyRunQuery<TError = Error>(
  runId: string | null,
  options: QueryOptionsWithPolling<Run, TError> = {}
): UseQueryResult<Run, TError> {
  const isEnabled = options.enabled !== false && runId != null

  const { notifyOnSettled, shouldRefetch } = useNotifyDataReady({
    topic: `robot-server/runs/${runId}` as NotifyTopic,
    options: { ...options, enabled: options.enabled != null && runId != null },
  })

  const httpResponse = useRunQuery(runId, {
    ...options,
    enabled: isEnabled && shouldRefetch,
    onSettled: notifyOnSettled,
  })

  return httpResponse
}
