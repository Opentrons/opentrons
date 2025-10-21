import { useQuery } from 'react-query'

import { getDataFile } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { DataFileDataResponse, HostConfig } from '@opentrons/api-client'

export function useDataFileQuery(
  fileId: string,
  options?: UseQueryOptions<DataFileDataResponse>
): UseQueryResult<DataFileDataResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DataFileDataResponse> = {
    ...options,
    enabled: host !== null && fileId !== null,
  }

  const query = useQuery<DataFileDataResponse>(
    [host, 'dataFiles', fileId],
    () =>
      getDataFile(host as HostConfig, fileId).then(response => response.data),
    allOptions
  )
  return query
}
