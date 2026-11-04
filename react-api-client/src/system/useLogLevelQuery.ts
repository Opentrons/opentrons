import { useQuery } from 'react-query'

import { getLogLevel } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { HostConfig, LogLevelPayload } from '@opentrons/api-client'

export type UseLogLevelQueryOptions = UseQueryOptions<LogLevelPayload>

export function logLevelQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'settings', 'log_level', 'local')
}

export function useLogLevelQuery(
  options: UseLogLevelQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<LogLevelPayload> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    logLevelQueryKey(host),
    () => getLogLevel(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
