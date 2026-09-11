import { useQuery } from 'react-query'

import { getAuthSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AuthSettingsResponse, HostConfig } from '@opentrons/api-client'

export function useAuthSettingsQuery(
  options: UseQueryOptions<AuthSettingsResponse, AxiosError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AuthSettingsResponse, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery<AuthSettingsResponse, AxiosError>(
    getQueryKey(host, 'auth', 'settings'),
    () => getAuthSettings(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
