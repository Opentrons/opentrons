import { searchLabwareOffsets } from '@opentrons/api-client'
import type {
  HostConfig,
  SearchLabwareOffsetsRequest,
  SearchLabwareOffsetsResponse,
} from '@opentrons/api-client'
import type { AxiosError } from 'axios'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useSearchLabwareOffsets(
  data: SearchLabwareOffsetsRequest,
  options: UseQueryOptions<SearchLabwareOffsetsResponse, AxiosError> = {}
): UseQueryResult<SearchLabwareOffsetsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<SearchLabwareOffsetsResponse, AxiosError>(
    [host, 'searchLabwareOffsets', data],
    () =>
      searchLabwareOffsets(host as HostConfig, data)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
