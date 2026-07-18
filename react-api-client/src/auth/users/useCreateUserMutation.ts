import { createUser } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { AuthUserResponse, CreateUserRequest } from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'

export type UseCreateUserMutationResult = UseMutationResult<
  AuthUserResponse,
  AxiosError,
  CreateUserRequest
> & {
  createUser: UseMutateAsyncFunction<
    AuthUserResponse,
    AxiosError,
    CreateUserRequest
  >
}

export function useCreateUserMutation(
  options: UseMutationOptions<
    AuthUserResponse,
    AxiosError,
    CreateUserRequest
  > = {},
  documentationState: DocumentationState
): UseCreateUserMutationResult {
  const host = useHost()
  const mutation = useDocumentedMutation(
    documentationState,
    [],
    getQueryKey(host, 'auth', 'users'),
    ({ variables: data, userNotes }) =>
      createUser(host!, data).then(response => response.data),
    options
  )

  return {
    ...mutation,
    createUser: mutation.mutateAsync,
  }
}
