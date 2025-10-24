import { useQuery } from 'react-query'

import { getDataFileRaw } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  DownloadedDataFileResponse,
  HostConfig,
} from '@opentrons/api-client'

export function useDataFileRawQuery(
  fileId: string,
  options?: UseQueryOptions<DownloadedDataFileResponse>
): UseQueryResult<DownloadedDataFileResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedDataFileResponse> = {
    ...options,
    enabled: host !== null && fileId !== null,
  }

  const query = useQuery<DownloadedDataFileResponse>(
    [host, 'dataFiles', fileId, 'download'],
    () =>
      getDataFileRaw(host as HostConfig, fileId).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
