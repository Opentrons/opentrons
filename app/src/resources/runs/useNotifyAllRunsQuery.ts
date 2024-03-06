import * as React from 'react'

import { useAllRunsQuery } from '@opentrons/react-api-client'

import { useNotifyService } from '../useNotifyService'

import type { UseQueryResult } from 'react-query'
import type { AxiosError } from 'axios'
import type { HostConfig, GetRunsParams, Runs } from '@opentrons/api-client'
import type { UseAllRunsQueryOptions } from '@opentrons/react-api-client/src/runs/useAllRunsQuery'
import type {
  QueryOptionsWithPolling,
  HTTPRefetchFrequency,
} from '../useNotifyService'

export function useNotifyAllRunsQuery(
  params: GetRunsParams = {},
  options: QueryOptionsWithPolling<UseAllRunsQueryOptions, AxiosError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<Runs, AxiosError> {
  const [
    refetchUsingHTTP,
    setRefetchUsingHTTP,
  ] = React.useState<HTTPRefetchFrequency>(null)

  useNotifyService<UseAllRunsQueryOptions, AxiosError>({
    topic: 'robot-server/runs',
    setRefetchUsingHTTP,
    options,
    hostOverride,
  })

  const httpResponse = useAllRunsQuery(
    params,
    {
      ...(options as UseAllRunsQueryOptions),
      enabled: options?.enabled !== false && refetchUsingHTTP != null,
      onSettled:
        refetchUsingHTTP === 'once'
          ? () => setRefetchUsingHTTP(null)
          : () => null,
    },
    hostOverride
  )

  return httpResponse
}
