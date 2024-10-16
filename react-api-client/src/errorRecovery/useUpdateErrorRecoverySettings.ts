import { useMutation } from 'react-query'

import { updateErrorRecoverySettings } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutationOptions,
  UseMutationResult,
  UseMutateFunction,
} from 'react-query'
import type { AxiosError } from 'axios'
import type {
  HostConfig,
  ErrorRecoverySettingsResponse,
  ErrorRecoverySettingsRequest,
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
    [host, 'errorRecovery', 'settings'],
    (settings: ErrorRecoverySettingsRequest) =>
      updateErrorRecoverySettings(host as HostConfig, settings)
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
