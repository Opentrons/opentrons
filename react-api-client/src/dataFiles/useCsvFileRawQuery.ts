import { getCsvFileRaw } from '@opentrons/api-client'
import type {
  DownloadedCsvFileResponse,
  HostConfig,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useCsvFileRawQuery(
  fileId: string,
  options?: UseQueryOptions<DownloadedCsvFileResponse>
): UseQueryResult<DownloadedCsvFileResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<DownloadedCsvFileResponse> = {
    ...options,
    enabled: host !== null && fileId !== null,
  }

  const query = useQuery<DownloadedCsvFileResponse>(
    [host, 'dataFiles', fileId, 'download'],
    () =>
      getCsvFileRaw(host as HostConfig, fileId).then(response => response.data),
    allOptions
  )
  return query
}
