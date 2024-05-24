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
  const { notifyOnSettled, shouldRefetch } = useNotifyService({
    topic: 'robot-server/runs',
    options,
    hostOverride,
  })

  const httpResponse = useAllRunsQuery(
    params,
    {
      ...(options as UseAllRunsQueryOptions),
      enabled: options?.enabled !== false && shouldRefetch,
      onSettled: notifyOnSettled,
    },
    hostOverride
  )

  return httpResponse
}
