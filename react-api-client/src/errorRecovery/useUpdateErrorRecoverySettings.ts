import { useMutation } from 'react-query'

import { updateErrorRecoverySettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorRecoverySettingsRequest,
  ErrorRecoverySettingsResponse,
} from '@opentrons/api-client'

export type UseUpdateErrorRecoverySettingsMutationResult = UseMutationResult<
  ErrorRecoverySettingsResponse,
  AxiosError,
  ErrorRecoverySettingsRequest
> & {
  updateErrorRecoverySettings: UseMutateFunction<
    ErrorRecoverySettingsResponse,
    AxiosError,
    ErrorRecoverySettingsRequest
  >
}

export function useUpdateErrorRecoverySettings(
  options: UseMutationOptions<
    ErrorRecoverySettingsResponse,
    AxiosError,
    ErrorRecoverySettingsRequest
  > = {}
): UseUpdateErrorRecoverySettingsMutationResult {
  const host = useHost()
  const mutation = useMutation(
    getQueryKey(host, 'errorRecovery', 'settings'),
    (settings: ErrorRecoverySettingsRequest) =>
      updateErrorRecoverySettings(host!, settings)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    updateErrorRecoverySettings: mutation.mutateAsync,
  }
}
