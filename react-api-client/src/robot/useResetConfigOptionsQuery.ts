import { useQuery } from 'react-query'

import { getResetConfigOptions } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  HostConfig,
  ResetConfigOptionsResponse,
} from '@opentrons/api-client'

export type UseResetConfigOptionsQueryOptions =
  UseQueryOptions<ResetConfigOptionsResponse>

export function resetConfigOptionsQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'settings', 'resetOptions')
}

export function useResetConfigOptionsQuery(
  options: UseResetConfigOptionsQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<ResetConfigOptionsResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    resetConfigOptionsQueryKey(host),
    () => getResetConfigOptions(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
