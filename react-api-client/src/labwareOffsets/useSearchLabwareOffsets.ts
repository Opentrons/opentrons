import { useQuery } from 'react-query'

import { searchLabwareOffsets } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  AxiosError,
  SearchLabwareOffsetsRequest,
  SearchLabwareOffsetsResponse,
} from '@opentrons/api-client'

export function useSearchLabwareOffsets(
  data: SearchLabwareOffsetsRequest,
  options: UseQueryOptions<SearchLabwareOffsetsResponse, AxiosError> = {}
): UseQueryResult<SearchLabwareOffsetsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<SearchLabwareOffsetsResponse, AxiosError>(
    [host, 'searchLabwareOffsets', data],
    () =>
      searchLabwareOffsets(host!, data)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
