import { useMutation } from 'react-query'

import { validateSelfPassword } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  EmptyResponse,
  HostConfig,
  ValidateSelfPasswordRequest,
} from '@opentrons/api-client'

export type UseValidateSelfPasswordMutationResult = UseMutationResult<
  EmptyResponse,
  AxiosError,
  ValidateSelfPasswordRequest
> & {
  validateSelfPassword: UseMutateAsyncFunction<
    EmptyResponse,
    AxiosError,
    ValidateSelfPasswordRequest
  >
}

export type UseValidateSelfPasswordMutationOptions = UseMutationOptions<
  EmptyResponse,
  AxiosError,
  ValidateSelfPasswordRequest
>

/**
 * Dry-run password policy check for the current user (`POST …/validatePassword`).
 * Does not change account state; documentation is not required.
 */
export function useValidateSelfPasswordMutation(
  options: UseValidateSelfPasswordMutationOptions = {},
  hostOverride?: HostConfig | null
): UseValidateSelfPasswordMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  // Auth validation endpoint, does not require documentation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation -- directly calling useMutation is deprecated in the codebase. Update this to useDocumentedMutation before using this function.
  const mutation = useMutation(
    getQueryKey(host, 'auth/users/self/validatePassword'),
    (body: ValidateSelfPasswordRequest) =>
      validateSelfPassword(host!, body).then(response => response.data),
    options
  )

  return {
    ...mutation,
    validateSelfPassword: mutation.mutateAsync,
  }
}
