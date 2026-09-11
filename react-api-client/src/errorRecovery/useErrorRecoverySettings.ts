import { useQuery } from 'react-query'

import { getErrorRecoverySettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ErrorRecoverySettingsResponse } from '@opentrons/api-client'

export function useErrorRecoverySettings(
  options: UseQueryOptions<ErrorRecoverySettingsResponse, AxiosError> = {}
): UseQueryResult<ErrorRecoverySettingsResponse, AxiosError> {
  const host = useHost()
  const query = useQuery<ErrorRecoverySettingsResponse, AxiosError>(
    getQueryKey(host, 'errorRecovery', 'settings'),
    () =>
      getErrorRecoverySettings(host!)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    { enabled: host !== null, ...options }
  )

  return query
}
