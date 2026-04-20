import { useQuery } from 'react-query'

import { getRunLoadedLabwareDefintions } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  HostConfig,
  HttpClientError,
  RunLoadedLabwareDefinitions,
} from '@opentrons/api-client'

export function useRunLoadedLabwareDefinitions(
  runId: string | null,
  options: UseQueryOptions<RunLoadedLabwareDefinitions, HttpClientError> = {},
  hostOverride?: HostConfig
): UseQueryResult<RunLoadedLabwareDefinitions, HttpClientError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery<RunLoadedLabwareDefinitions, HttpClientError>(
    [host, 'runs', runId, 'loaded_labware_definitions'],
    () =>
      getRunLoadedLabwareDefintions(host!, runId!).then(
        response => response.data
      ),
    {
      enabled: host != null && runId != null && options.enabled !== false,
      ...options,
    }
  )
}
