import { useQuery } from 'react-query'

import { getImageFile } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, ImageFileDataResponse } from '@opentrons/api-client'

export function useImageFileQuery(
  runId: string,
  options?: UseQueryOptions<ImageFileDataResponse>
): UseQueryResult<ImageFileDataResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<ImageFileDataResponse> = {
    ...options,
    enabled: host !== null && runId !== null,
  }

  const query = useQuery<ImageFileDataResponse>(
    [host, 'images', runId],
    () =>
      getImageFile(host as HostConfig, runId).then(response => response.data),
    allOptions
  )
  return query
}
