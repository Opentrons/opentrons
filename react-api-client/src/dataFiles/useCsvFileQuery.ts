import { useQuery } from 'react-query'
import { getCsvFile } from '@opentrons/api-client'
import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, CsvFileDataResponse } from '@opentrons/api-client'

export function useCsvFileQuery(
  fileId: string,
  options?: UseQueryOptions<CsvFileDataResponse>
): UseQueryResult<CsvFileDataResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<CsvFileDataResponse> = {
    ...options,
    enabled: host !== null && fileId !== null,
  }

  const query = useQuery<CsvFileDataResponse>(
    [host, 'dataFiles', fileId],
    () =>
      getCsvFile(host as HostConfig, fileId).then(response => response.data),
    allOptions
  )
  return query
}
