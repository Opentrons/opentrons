import { useQuery } from 'react-query'

import { getRunRaw } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  DownloadedRunResponse,
  RequestConfig,
} from '@opentrons/api-client'

export function useRunRawQuery(
  runId: string,
  options?: UseQueryOptions<DownloadedRunResponse>,
  responseType?: RequestConfig<unknown>['responseType']
): UseQueryResult<DownloadedRunResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedRunResponse> = {
    ...options,
    enabled: host !== null && runId !== null,
  }

  const query = useQuery<DownloadedRunResponse>(
    getQueryKey(host, 'runs', runId, 'download'),
    () => getRunRaw(host!, runId, responseType).then(response => response.data),
    allOptions
  )
  return query
}
