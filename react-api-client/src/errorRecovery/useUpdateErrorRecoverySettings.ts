import { updateErrorRecoverySettings } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
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
import type { DocumentationState } from '../accessControl'

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

export type UseUpdateErrorRecoverySettingsMutationOptions = UseMutationOptions<
  ErrorRecoverySettingsResponse,
  AxiosError,
  ErrorRecoverySettingsRequest
>

export function useUpdateErrorRecoverySettings(
  documentationState: DocumentationState,
  options: UseUpdateErrorRecoverySettingsMutationOptions = {}
): UseUpdateErrorRecoverySettingsMutationResult {
  const host = useHost()
  const mutation = useDocumentedMutation<
    ErrorRecoverySettingsResponse,
    AxiosError,
    ErrorRecoverySettingsRequest
  >(
    documentationState,
    ['update_error_recovery_settings'],
    getQueryKey(host, 'errorRecovery', 'settings'),
    ({ variables: settings, userNotes }) =>
      updateErrorRecoverySettings(host!, settings, userNotes)
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
