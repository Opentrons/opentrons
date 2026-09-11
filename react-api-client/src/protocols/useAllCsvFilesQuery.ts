import { useQuery } from 'react-query'

import { getCsvFiles } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { UploadedCsvFilesResponse } from '@opentrons/api-client'

export function useAllCsvFilesQuery(
  protocolId: string,
  options?: UseQueryOptions<UploadedCsvFilesResponse>
): UseQueryResult<UploadedCsvFilesResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<UploadedCsvFilesResponse> = {
    ...options,
    enabled: host !== null && protocolId !== null,
  }

  const query = useQuery<UploadedCsvFilesResponse>(
    getQueryKey(host, 'protocols', protocolId, 'dataFiles'),
    () => getCsvFiles(host!, protocolId).then(response => response.data),
    allOptions
  )
  return query
}
