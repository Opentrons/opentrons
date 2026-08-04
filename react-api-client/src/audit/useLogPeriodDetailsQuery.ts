import { useQuery } from 'react-query'

import { getLogPeriodDetails } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { LogPeriodDetailsResponse } from '@opentrons/api-client'

export function useLogPeriodDetailsQuery(
  logPeriodId: string,
  options: UseQueryOptions<LogPeriodDetailsResponse> = {}
): UseQueryResult<LogPeriodDetailsResponse> {
  const host = useHost()
  const query = useQuery<LogPeriodDetailsResponse>(
    getQueryKey(host, 'audit', 'logPeriods', logPeriodId),
    () =>
      getLogPeriodDetails(host!, logPeriodId).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
