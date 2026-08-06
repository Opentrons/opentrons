import { createUser } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CreateUserRequest,
  CreateUserResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'

export type UseCreateUserMutationResult = UseMutationResult<
  CreateUserResponse,
  AxiosError,
  CreateUserRequest
> & {
  createUser: UseMutateAsyncFunction<
    CreateUserResponse,
    AxiosError,
    CreateUserRequest
  >
}

export function useCreateUserMutation(
  documentationState: DocumentationState,
  options: UseMutationOptions<
    CreateUserResponse,
    AxiosError,
    CreateUserRequest
  > = {}
): UseCreateUserMutationResult {
  const host = useHost()
  const mutation = useDocumentedMutation(
    documentationState,
    ['create_user'],
    getQueryKey(host, 'auth', 'users'),
    ({ variables: data, userNotes }) =>
      createUser(host!, data, userNotes).then(response => response.data),
    options
  )

  return {
    ...mutation,
    createUser: mutation.mutateAsync,
  }
}
