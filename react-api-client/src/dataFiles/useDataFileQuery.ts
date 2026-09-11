import { useQuery } from 'react-query'

import { getDataFile } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { DataFileDataResponse } from '@opentrons/api-client'

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
    getQueryKey(host, 'dataFiles', fileId),
    () => getDataFile(host!, fileId).then(response => response.data),
    allOptions
  )
  return query
}
