import { getCsvFile } from '@opentrons/api-client'
import type { CsvFileDataResponse, HostConfig } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

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
