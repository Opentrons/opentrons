import { useQuery } from 'react-query'

import { getAuditSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AuditSettingsResponse, HostConfig } from '@opentrons/api-client'

export function useAuditSettingsQuery(
  options: UseQueryOptions<AuditSettingsResponse, AxiosError> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AuditSettingsResponse, AxiosError> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery<AuditSettingsResponse, AxiosError>(
    getQueryKey(host, 'audit', 'external', 'settings'),
    () => getAuditSettings(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )
  return query
}
