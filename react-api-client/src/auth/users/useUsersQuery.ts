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
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  return useQuery<AuthUsersResponse, AxiosError>(
    getUsersQueryKey(host),
    () => getUsers(host!).then(response => response.data),
    { enabled: host != null, ...options }
  )
}
