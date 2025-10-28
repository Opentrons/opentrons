import { useQuery } from 'react-query'

import { getAllRunImages } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  DownloadedImageFileResponse,
  HostConfig,
} from '@opentrons/api-client'

export function useAllRunImagesRaw(
  runId: string,
  options: UseQueryOptions<DownloadedImageFileResponse> = {}
): UseQueryResult<DownloadedImageFileResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedImageFileResponse> = {
    ...options,
    enabled: host !== null && runId !== null && options.enabled,
  }

  const query = useQuery<DownloadedImageFileResponse>(
    [host, 'dataFiles', runId, 'images', 'download'],
    () =>
      getAllRunImages(host as HostConfig, runId).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
