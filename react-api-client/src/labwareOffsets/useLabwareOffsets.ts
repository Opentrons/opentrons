import { useQuery } from 'react-query'

import { getLabwareOffsets } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  LabwareOffsetsResponse,
  LabwareOffsetsSearchParams,
} from '@opentrons/api-client'

export function useLabwareOffsets(
  params: LabwareOffsetsSearchParams = {},
  options: UseQueryOptions<LabwareOffsetsResponse, AxiosError> = {}
): UseQueryResult<LabwareOffsetsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<LabwareOffsetsResponse, AxiosError>(
    getQueryKey(host, 'labwareOffsets', params),
    () =>
      getLabwareOffsets(host!, params)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
