import { useQuery } from 'react-query'

import { getImageFiles } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, ImageFilesDataResponse } from '@opentrons/api-client'

export function useImageFileQuery(
  runId: string,
  options?: UseQueryOptions<ImageFilesDataResponse>
): UseQueryResult<ImageFilesDataResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<ImageFilesDataResponse> = {
    ...options,
    enabled: host !== null && runId !== null,
  }

  const query = useQuery<ImageFilesDataResponse>(
    [host, '/dataFiles/', runId, '/images'],
    () =>
      getImageFiles(host as HostConfig, runId).then(response => response.data),
    allOptions
  )
  return query
}
