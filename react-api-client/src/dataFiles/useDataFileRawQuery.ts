import { useQuery } from 'react-query'

import { getDataFileRaw } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosRequestConfig } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { DownloadedDataFileResponse } from '@opentrons/api-client'

// TODO(jh, 10-28-25): Split this into two hooks, perhaps in /app, that
//  parses the return data via axiosConfig based on known metadata about the
//  the data file id. The data file id metadata is always known through various
//  /dataFile endpoints.
export function useDataFileRawQuery(
  fileId: string,
  options?: UseQueryOptions<DownloadedDataFileResponse>,
  axiosConfig?: AxiosRequestConfig
): UseQueryResult<DownloadedDataFileResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedDataFileResponse> = {
    ...options,
    enabled: host !== null && fileId !== null,
  }

  const query = useQuery<DownloadedDataFileResponse>(
    getQueryKey(host, 'dataFiles', fileId, 'download'),
    () =>
      getDataFileRaw(host!, fileId, axiosConfig).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
