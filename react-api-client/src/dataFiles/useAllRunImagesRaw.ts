import { useQuery } from 'react-query'

import { getAllRunImages } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { DownloadedImageFileResponse } from '@opentrons/api-client'

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
    getQueryKey(host, 'dataFiles', runId, 'images', 'download'),
    () => getAllRunImages(host!, runId).then(response => response.data),
    allOptions
  )
  return query
}
