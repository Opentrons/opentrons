import { useRunQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { Run, HostConfig } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'
import type { NotifyTopic } from '../../redux/shell/types'

// TODO(jh, 08-21-24): Abstract harder.
export function useNotifyRunQuery<TError = Error>(
  runId: string | null,
  options: QueryOptionsWithPolling<Run, TError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Run, TError> {
  const {
    notifyOnSettled,
    shouldRefetch,
    isNotifyEnabled,
  } = useNotifyDataReady({
    topic: `robot-server/runs/${runId}` as NotifyTopic,
    options,
    hostOverride,
  })

  const queryOptions = {
    ...options,
    onSettled: isNotifyEnabled ? notifyOnSettled : options.onSettled,
    refetchInterval: isNotifyEnabled ? false : options.refetchInterval,
  }
  const httpResponse = useRunQuery(runId, queryOptions, hostOverride)

  if (isNotifyEnabled && shouldRefetch) {
    httpResponse.refetch()
  }

  return httpResponse
}
