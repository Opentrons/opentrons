import { useQuery } from 'react-query'

import { getRunLoadedLabwareDefintions } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  HostConfig,
  RunLoadedLabwareDefinitions,
} from '@opentrons/api-client'

export function useRunLoadedLabwareDefinitions(
  runId: string | null,
  options: UseQueryOptions<RunLoadedLabwareDefinitions, AxiosError> = {},
  hostOverride?: HostConfig
): UseQueryResult<RunLoadedLabwareDefinitions, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery<RunLoadedLabwareDefinitions, AxiosError>(
    getQueryKey(host, 'runs', runId, 'loaded_labware_definitions'),
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
