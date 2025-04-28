import { getRunLoadedLabwareDefintions } from '@opentrons/api-client'
import type {
  HostConfig,
  RunLoadedLabwareDefinitions,
} from '@opentrons/api-client'
import type { AxiosError } from 'axios'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useRunLoadedLabwareDefinitions(
  runId: string | null,
  options: UseQueryOptions<RunLoadedLabwareDefinitions, AxiosError> = {},
  hostOverride?: HostConfig
): UseQueryResult<RunLoadedLabwareDefinitions, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery<RunLoadedLabwareDefinitions, AxiosError>(
    [host, 'runs', runId, 'loaded_labware_definitions'],
    () =>
      getRunLoadedLabwareDefintions(host as HostConfig, runId as string).then(
        response => response.data
      ),
    {
      enabled: host != null && runId != null && options.enabled !== false,
      ...options,
    }
  )
}
