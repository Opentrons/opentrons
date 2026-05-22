import { useQuery } from 'react-query'

import { getSelf } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AuthUserResponse, HostConfig } from '@opentrons/api-client'

export function useSelfQuery(
  options?: UseQueryOptions<AuthUserResponse, AxiosError>,
  hostOverride?: HostConfig | null
): UseQueryResult<AuthUserResponse, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery<AuthUserResponse, AxiosError>(
    getQueryKey(host, 'auth', 'users', 'self'),
    () => getSelf(host!).then(response => response.data),
    { enabled: host != null, ...options }
  )

  return query
}
