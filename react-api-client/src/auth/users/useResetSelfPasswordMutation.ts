import { useMutation } from 'react-query'

import { resetSelfPassword } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AuthUserResponse,
  HostConfig,
  UpdateSelfPasswordRequest,
} from '@opentrons/api-client'

export type UseResetSelfPasswordMutationResult = UseMutationResult<
  AuthUserResponse,
  AxiosError,
  UpdateSelfPasswordRequest
> & {
  resetSelfPassword: UseMutateAsyncFunction<
    AuthUserResponse,
    AxiosError,
    UpdateSelfPasswordRequest
  >
}

export function useResetSelfPasswordMutation(
  options: UseMutationOptions<
    AuthUserResponse,
    AxiosError,
    UpdateSelfPasswordRequest
  > = {},
  hostOverride?: HostConfig | null
): UseResetSelfPasswordMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation(
    getQueryKey(host, 'auth', 'users', 'self', 'resetPassword'),
    (body: UpdateSelfPasswordRequest) =>
      resetSelfPassword(host!, body).then(response => response.data),
    options
  )

  return {
    ...mutation,
    resetSelfPassword: mutation.mutateAsync,
  }
}
