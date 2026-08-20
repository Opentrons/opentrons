import { useEffect } from 'react'

import { useAllRunsQuery } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../useNotifyDataReady'

import type { AxiosError } from 'axios'
import type { UseQueryResult } from 'react-query'
import type { GetRunsParams, HostConfig, Runs } from '@opentrons/api-client'
import type { UseAllRunsQueryOptions } from '@opentrons/react-api-client/src/runs/useAllRunsQuery'
import type { QueryOptionsWithPolling } from '../useNotifyDataReady'

export type UseNotifyAllRunsQueryOptions = QueryOptionsWithPolling<
  UseAllRunsQueryOptions,
  AxiosError
>

// TODO(jh, 08-21-24): Abstract harder.
export function useNotifyAllRunsQuery(
  params: GetRunsParams = {},
  options: UseNotifyAllRunsQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Runs, AxiosError> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: 'robot-server/runs',
    options,
    hostOverride,
  })

  const httpQueryResult = useAllRunsQuery(
    params,
    queryOptionsNotify as UseAllRunsQueryOptions,
    hostOverride
  )
  const { refetch: refetchQuery } = httpQueryResult

  useEffect(() => {
    if (refetch > 0) {
      void refetchQuery()
    }
  }, [refetch, refetchQuery])

  return httpQueryResult
}
