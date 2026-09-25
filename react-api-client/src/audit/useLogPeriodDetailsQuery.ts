import { useQuery } from 'react-query'
import { type AxiosError } from 'axios'

import { getLogPeriodDetails } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { LogPeriodDetails } from '@opentrons/api-client'

export function useLogPeriodDetailsQuery(
  logPeriodId: string,
  options: UseQueryOptions<LogPeriodDetails, AxiosError> = {}
): UseQueryResult<LogPeriodDetails, AxiosError> {
  const host = useHost()
  const query = useQuery<LogPeriodDetails, AxiosError>(
    getQueryKey(host, 'audit', 'logPeriods', logPeriodId),
    () =>
      getLogPeriodDetails(host!, logPeriodId).then(
        response => response.data.data
      ),
    { enabled: host !== null && logPeriodId !== '', ...options }
  )
  return query
}
