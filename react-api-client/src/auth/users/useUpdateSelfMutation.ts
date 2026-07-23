import { updateSelf } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
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
import type { DocumentationState } from '../../accessControl'
import type { DocumentedMutationParameters } from '../../accessControl/types'

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

export type UseUpdateSelfMutationOptions = UseMutationOptions<
  AuthUserResponse,
  AxiosError,
  UpdateSelfRequest
>

export function useUpdateSelfMutation(
  documentationState: DocumentationState,
  options: UseUpdateSelfMutationOptions = {},
  hostOverride?: HostConfig | null
): UseUpdateSelfMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useDocumentedMutation<
    AuthUserResponse,
    AxiosError,
    UpdateSelfRequest
  >(
    documentationState,
    ['update_self'],
    getQueryKey(host, 'auth', 'users', 'self'),
    ({
      variables: body,
      userNotes,
    }: DocumentedMutationParameters<UpdateSelfRequest>) =>
      updateSelf(host!, body, userNotes).then(response => response.data),
    options
  )

  return {
    ...mutation,
    updateSelf: mutation.mutateAsync,
  }
}
