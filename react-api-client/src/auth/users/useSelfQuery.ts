import { useQuery } from 'react-query'

import { getSelf } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  QueryClient,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from 'react-query'
import type { AuthUserResponse, HostConfig } from '@opentrons/api-client'

export function getSelfQueryKey(hostConfig: HostConfig | null): QueryKey {
  return getQueryKey(hostConfig, 'auth', 'users', 'self')
}

export function fetchSelf(hostConfig: HostConfig): Promise<AuthUserResponse> {
  return getSelf(hostConfig).then(response => response.data)
}

export function fetchSelfQuery(
  queryClient: QueryClient,
  hostConfig: HostConfig
): Promise<AuthUserResponse> {
  return queryClient.fetchQuery(getSelfQueryKey(hostConfig), () =>
    fetchSelf(hostConfig)
  )
}

export function useSelfQuery(
  options?: UseQueryOptions<AuthUserResponse, AxiosError>,
  hostOverride?: HostConfig | null
): UseQueryResult<AuthUserResponse, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery<AuthUserResponse, AxiosError>(
    getSelfQueryKey(host),
    () => fetchSelf(host!),
    { enabled: host != null, ...options }
  )

  return query
}
