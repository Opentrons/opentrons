import { useQuery } from 'react-query'

import { getAccessControlEnabled } from '@opentrons/api-client'

import { useHost } from '../../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AccessControlEnabledSettingsResponse } from '@opentrons/api-client'

export function useAccessControlEnabledQuery(
  options: UseQueryOptions<
    AccessControlEnabledSettingsResponse,
    AxiosError
  > = {}
): UseQueryResult<AccessControlEnabledSettingsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<AccessControlEnabledSettingsResponse, AxiosError>(
    [host, 'auth', 'settings', 'accessControlEnabled'],
    () => getAccessControlEnabled(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
