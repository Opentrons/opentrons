import * as React from 'react'

import { useRunQuery } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'
import type {
  QueryOptionsWithPolling,
  HTTPRefetchFrequency,
} from '../useNotifyService'
import type { NotifyTopic } from '../../redux/shell/types'

export function useNotifyRunQuery<TError = Error>(
  runId: string | null,
  options: QueryOptionsWithPolling<Run, TError> = {}
): UseQueryResult<Run, TError> {
  const [
    refetchUsingHTTP,
    setRefetchUsingHTTP,
  ] = React.useState<HTTPRefetchFrequency>(null)

  const isEnabled = options.enabled !== false && runId != null

  useNotifyService({
    topic: `robot-server/runs/${runId}` as NotifyTopic,
    setRefetchUsingHTTP,
    options: { ...options, enabled: options.enabled != null && runId != null },
  })

  const httpResponse = useRunQuery(runId, {
    ...options,
    enabled: isEnabled && refetchUsingHTTP != null,
    onSettled:
      refetchUsingHTTP === 'once'
        ? () => setRefetchUsingHTTP(null)
        : () => null,
  })

  return httpResponse
}
