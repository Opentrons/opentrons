import { useQuery } from 'react-query'

import { getAccessControlSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { AccessControlAppSettingsResponse } from '@opentrons/api-client'

export function useAppAccessControlSettingsQuery(
  options: UseQueryOptions<AccessControlAppSettingsResponse, AxiosError> = {}
): UseQueryResult<AccessControlAppSettingsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<AccessControlAppSettingsResponse, AxiosError>(
    getQueryKey(host, 'accessControl', 'settings'),
    () =>
      getAccessControlSettings(host!)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
