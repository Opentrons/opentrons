import { useQuery } from 'react-query'

import { getRunDataFileMetadata } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  HostConfig,
  RunDataFileMetadataResponse,
} from '@opentrons/api-client'

export function useRunDataFileMetadata(
  runId: string,
  options: UseQueryOptions<RunDataFileMetadataResponse> = {}
): UseQueryResult<RunDataFileMetadataResponse> {
  const host = useHost()
  const allOptions: UseQueryOptions<RunDataFileMetadataResponse> = {
    ...options,
    enabled: host !== null && runId !== null && options.enabled,
  }

  const query = useQuery<RunDataFileMetadataResponse>(
    [host, 'dataFiles', runId, 'all'],
    () =>
      getRunDataFileMetadata(host as HostConfig, runId).then(
        response => response.data
      ),
    allOptions
  )
  return query
}
