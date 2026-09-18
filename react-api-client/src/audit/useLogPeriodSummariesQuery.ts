import { useQuery } from 'react-query'

import { getLogPeriodSummaries } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { LogPeriodSummariesResponse } from '@opentrons/api-client'

export function useLogPeriodSummariesQuery(
  options: UseQueryOptions<LogPeriodSummariesResponse> = {}
): UseQueryResult<LogPeriodSummariesResponse> {
  const host = useHost()
  const query = useQuery<LogPeriodSummariesResponse>(
    getQueryKey(host, 'audit', 'logPeriods'),
    () => getLogPeriodSummaries(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
