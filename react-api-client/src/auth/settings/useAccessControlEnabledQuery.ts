import { useQuery } from 'react-query'

import { getAccessControlEnabled } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { QueryKey, UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  AccessControlEnabledSettingsResponse,
  HostConfig,
} from '@opentrons/api-client'

export function accessControlEnabledQueryKey(
  hostConfig: HostConfig | null
): QueryKey {
  return getQueryKey(hostConfig, 'auth', 'settings', 'accessControlEnabled')
}

export function useAccessControlEnabledQuery(
  options: UseQueryOptions<
    AccessControlEnabledSettingsResponse,
    AxiosError
  > = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AccessControlEnabledSettingsResponse, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery<AccessControlEnabledSettingsResponse, AxiosError>(
    accessControlEnabledQueryKey(host),
    () => getAccessControlEnabled(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
