import { useQuery } from 'react-query'

import { getRunCurrentState } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, RunCurrentState } from '@opentrons/api-client'

export function useRunCurrentState(
  runId: string | null,
  options: UseQueryOptions<RunCurrentState, AxiosError> = {},
  hostOverride?: HostConfig
): UseQueryResult<RunCurrentState, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery<RunCurrentState, AxiosError>(
    getQueryKey(host, 'runs', runId, 'currentState'),
    () => getRunCurrentState(host!, runId!).then(response => response.data),
    {
      enabled: host != null && runId != null && options.enabled !== false,
      ...options,
    }
  )
}
