import { useMemo, useRef } from 'react'
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

  const host = useMemo(() => {
    return hostOverride != null
      ? { ...contextHost, ...hostOverride }
      : contextHost
  }, [contextHost, hostOverride])

  // This is one of two queries in the api that require authentication.
  // We use a ref to ensure the query function uses the latest token when called from the ReactQuery cache.
  const hostRef = useRef<HostConfig | null>(host)
  hostRef.current = host

  const query = useQuery<AuthUserResponse, AxiosError>(
    getSelfQueryKey(host),
    () => fetchSelf(hostRef.current!),
    { enabled: host != null, ...options }
  )

  return query
}
