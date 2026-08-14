import { useEffect } from 'react'

import { useRunQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { UseQueryResult } from 'react-query'
import type { HostConfig, Run } from '@opentrons/api-client'
import type { NotifyTopic } from '/app/redux/shell/types'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

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

  useEffect(() => {
    if (shouldRefetch && runId != null && runId !== 'null') {
      void httpQueryResult.refetch()
    }

    // refetch is stable, the result object is not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefetch, runId])

  return httpQueryResult
}
