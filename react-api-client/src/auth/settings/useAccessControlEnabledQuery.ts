import { useQuery } from 'react-query'

import { getAccessControlEnabled } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  AccessControlEnabledSettingsResponse,
  HostConfig,
} from '@opentrons/api-client'

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
    getQueryKey(host, 'auth', 'settings', 'accessControlEnabled'),
    () =>
      getAccessControlEnabled(host!)
        .then(() => ({ data: { accessControlEnabled: true } }))
        .catch((error: AxiosError) => {
          if (error.response?.status === 404) {
            return { data: { accessControlEnabled: false } }
          }
          throw error
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
