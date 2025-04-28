import { getCsvFiles } from '@opentrons/api-client'
import type {
  HostConfig,
  UploadedCsvFilesResponse,
} from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

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
    [host, `protocols/${protocolId}/dataFiles`],
    () =>
      getCsvFiles(host as HostConfig, protocolId as string).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
