import { useQuery } from 'react-query'

import { searchLabwareOffsets } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  SearchLabwareOffsetsRequest,
  SearchLabwareOffsetsResponse,
} from '@opentrons/api-client'

export function useSearchLabwareOffsets(
  data: SearchLabwareOffsetsRequest,
  options: UseQueryOptions<SearchLabwareOffsetsResponse, AxiosError> = {}
): UseQueryResult<SearchLabwareOffsetsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<SearchLabwareOffsetsResponse, AxiosError>(
    getQueryKey(host, 'labwareOffsets', data),
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
