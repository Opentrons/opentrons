import { useMutation } from 'react-query'

import { updateSelf } from '@opentrons/api-client'

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

export type UseUpdateSelfMutationResult = UseMutationResult<
  AuthUserResponse,
  AxiosError,
  UpdateSelfPasswordRequest
> & {
  updateSelf: UseMutateAsyncFunction<
    AuthUserResponse,
    AxiosError,
    UpdateSelfPasswordRequest
  >
}

export function useUpdateSelfMutation(
  options: UseMutationOptions<
    AuthUserResponse,
    AxiosError,
    UpdateSelfPasswordRequest
  > = {},
  hostOverride?: HostConfig | null
): UseUpdateSelfMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation(
    getQueryKey(host, 'auth', 'users', 'self'),
    (body: UpdateSelfPasswordRequest) =>
      updateSelf(host!, body).then(response => response.data),
    options
  )

  return {
    ...mutation,
    updateSelf: mutation.mutateAsync,
  }
}
