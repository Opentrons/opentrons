import { useMemo, useRef } from 'react'
import { useQuery } from 'react-query'

import { getUsers } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AuthUsersResponse, HostConfig } from '@opentrons/api-client'

export function getUsersQueryKey(
  hostConfig: HostConfig | null
): ReturnType<typeof getQueryKey> {
  return getQueryKey(hostConfig, 'auth', 'users')
}

export function useUsersQuery(
  options?: UseQueryOptions<AuthUsersResponse, AxiosError>,
  hostOverride?: HostConfig | null
): UseQueryResult<AuthUsersResponse, AxiosError> {
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

  return useQuery<AuthUsersResponse, AxiosError>(
    getUsersQueryKey(host),
    () => getUsers(hostRef.current!).then(response => response.data),
    { enabled: host != null, ...options }
  )
}
