import { useQuery } from 'react-query'

import { getRunCurrentState } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  HostConfig,
  HttpClientError,
  RunCurrentState,
} from '@opentrons/api-client'

export function useRunCurrentState(
  runId: string | null,
  options: UseQueryOptions<RunCurrentState, HttpClientError> = {},
  hostOverride?: HostConfig
): UseQueryResult<RunCurrentState, HttpClientError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery<RunCurrentState, HttpClientError>(
    [host, 'runs', runId, 'currentState'],
    () => getRunCurrentState(host!, runId!).then(response => response.data),
    {
      enabled: host != null && runId != null && options.enabled !== false,
      ...options,
    }
  )
}
