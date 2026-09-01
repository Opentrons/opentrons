import { useQuery } from 'react-query'

import { getRunRaw } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  DownloadedRunResponse,
  GetRunDownloadParams,
  RequestConfig,
} from '@opentrons/api-client'

export function useRunRawQuery(
  runId: string,
  params: GetRunDownloadParams = {},
  options?: UseQueryOptions<DownloadedRunResponse>,
  responseType?: RequestConfig<unknown>['responseType']
): UseQueryResult<DownloadedRunResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedRunResponse> = {
    ...options,
    enabled: host !== null && runId !== null,
  }

  const query = useQuery<DownloadedRunResponse>(
    getQueryKey(host, 'runs', runId, 'download', params),
    () =>
      getRunRaw(host!, runId, params, responseType).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
