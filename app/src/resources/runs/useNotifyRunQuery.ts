import * as React from 'react'

import { useRunQuery, useHost } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { Run } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'
import type { NotifyTopic } from '../../redux/shell/types'

export function useNotifyRunQuery<TError = Error>(
  runId: string | null,
  options: QueryOptionsWithPolling<Run, TError> = {}
): UseQueryResult<Run, TError> {
  const host = useHost()
  const [refetchUsingHTTP, setRefetchUsingHTTP] = React.useState(false)

  const { isNotifyError } = useNotifyService({
    topic: `robot-server/runs/${runId}` as NotifyTopic,
    refetchUsingHTTP: () => setRefetchUsingHTTP(true),
    options: { ...options, enabled: options.enabled && runId != null },
  })

  const isNotifyEnabled = !isNotifyError && !options?.forceHttpPolling
  if (!isNotifyEnabled && !refetchUsingHTTP) setRefetchUsingHTTP(true)
  const isHTTPEnabled =
    options?.enabled !== false &&
    refetchUsingHTTP &&
    host !== null &&
    runId != null

  const httpResponse = useRunQuery(runId, {
    ...options,
    enabled: isHTTPEnabled,
    onSettled: isNotifyEnabled ? () => setRefetchUsingHTTP(false) : undefined,
  })

  return httpResponse
}
