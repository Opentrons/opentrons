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
  UpdateSelfRequest,
} from '@opentrons/api-client'

export type UseUpdateSelfMutationResult = UseMutationResult<
  AuthUserResponse,
  AxiosError,
  UpdateSelfRequest
> & {
  updateSelf: UseMutateAsyncFunction<
    AuthUserResponse,
    AxiosError,
    UpdateSelfRequest
  >
}

export function useUpdateSelfMutation(
  options: UseMutationOptions<
    AuthUserResponse,
    AxiosError,
    UpdateSelfRequest
  > = {},
  hostOverride?: HostConfig | null
): UseUpdateSelfMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation(
    getQueryKey(host, 'auth', 'users', 'self'),
    (body: UpdateSelfRequest) =>
      updateSelf(host!, body).then(response => response.data),
    options
  )

  return {
    ...mutation,
    updateSelf: mutation.mutateAsync,
  }
}
