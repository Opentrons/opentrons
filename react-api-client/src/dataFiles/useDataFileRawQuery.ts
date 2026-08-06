import { useQuery } from 'react-query'

import { getDataFileRaw } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  DownloadedDataFileResponse,
  RequestConfig,
} from '@opentrons/api-client'

// TODO(jh, 10-28-25): Split this into two hooks, perhaps in /app, that
//  parses the return data via responseType based on known metadata about the
//  the data file id. The data file id metadata is always known through various
//  /dataFile endpoints.
export function useDataFileRawQuery(
  fileId: string,
  options?: UseQueryOptions<DownloadedDataFileResponse>,
  responseType?: RequestConfig<unknown>['responseType']
): UseQueryResult<DownloadedDataFileResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedDataFileResponse> = {
    ...options,
    enabled: host !== null && fileId !== null,
  }

  const query = useQuery<DownloadedDataFileResponse>(
    getQueryKey(host, 'dataFiles', fileId, 'download'),
    () =>
      getDataFileRaw(host!, fileId, responseType).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
