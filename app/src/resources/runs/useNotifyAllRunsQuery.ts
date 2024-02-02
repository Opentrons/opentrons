import * as React from 'react'

import { useAllRunsQuery } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { AxiosError } from 'axios'
import type { HostConfig, GetRunsParams, Runs } from '@opentrons/api-client'
import type { UseAllRunsQueryOptions } from '@opentrons/react-api-client/src/runs/useAllRunsQuery'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyAllRunsQuery(
  params: GetRunsParams = {},
  options: QueryOptionsWithPolling<UseAllRunsQueryOptions, AxiosError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Runs, AxiosError> {
  const [refetchUsingHTTP, setRefetchUsingHTTP] = React.useState(false)

  const { isNotifyError } = useNotifyService<
    UseAllRunsQueryOptions,
    AxiosError
  >({
    topic: 'robot-server/runs',
    refetchUsingHTTP: () => setRefetchUsingHTTP(true),
    options,
  })

  const isNotifyEnabled = !isNotifyError && !options?.forceHttpPolling
  if (!isNotifyEnabled && !refetchUsingHTTP) setRefetchUsingHTTP(true)
  const isHTTPEnabled = options?.enabled !== false && refetchUsingHTTP

  const httpResponse = useAllRunsQuery(
    params,
    {
      ...(options as UseAllRunsQueryOptions),
      enabled: isHTTPEnabled,
      onSettled: isNotifyEnabled ? () => setRefetchUsingHTTP(false) : undefined,
    },
    hostOverride
  )

  return httpResponse
}
