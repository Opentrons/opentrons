import { useQuery } from 'react-query'

import { getEapOptions } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type { EapOptionsResponse, HostConfig } from '@opentrons/api-client'

export type UseEapOptionsQueryOptions = UseQueryOptions<EapOptionsResponse>

export function eapOptionsQueryKey(host: HostConfig | null): QueryKey {
  return getQueryKey(host, 'networking', 'eapOptions')
}

export function useEapOptionsQuery(
  options: UseEapOptionsQueryOptions = {},
  hostOverride?: HostConfig | null
): UseQueryResult<EapOptionsResponse> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    eapOptionsQueryKey(host),
    () => getEapOptions(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
