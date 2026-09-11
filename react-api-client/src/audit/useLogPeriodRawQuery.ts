import { useQuery } from 'react-query'

import { getLogPeriodRaw } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  DownloadedLogPeriodResponse,
  RequestConfig,
} from '@opentrons/api-client'

export function useLogPeriodRawQuery(
  logPeriodId: string,
  options?: UseQueryOptions<DownloadedLogPeriodResponse>,
  responseType?: RequestConfig<unknown>['responseType']
): UseQueryResult<DownloadedLogPeriodResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedLogPeriodResponse> = {
    ...options,
    enabled: host !== null && logPeriodId !== null,
  }

  const query = useQuery<DownloadedLogPeriodResponse>(
    getQueryKey(host, 'audit', 'logPeriods', logPeriodId, 'download'),
    () =>
      getLogPeriodRaw(host!, logPeriodId, responseType).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
