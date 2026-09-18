import { useQueryClient } from 'react-query'

import { resetUserPassword } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { useHost } from '../../api'
import { getUsersQueryKey } from './useUsersQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { TemporaryPasswordAuthUserResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'

export type UseResetUserPasswordMutationResult = UseMutationResult<
  TemporaryPasswordAuthUserResponse,
  AxiosError,
  string
> & {
  resetUserPassword: UseMutateAsyncFunction<
    TemporaryPasswordAuthUserResponse,
    AxiosError,
    string
  >
}

export function useResetUserPasswordMutation(
  documentationState: DocumentationState,
  options: UseMutationOptions<
    TemporaryPasswordAuthUserResponse,
    AxiosError,
    string
  > = {}
): UseResetUserPasswordMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation(
    documentationState,
    ['reset_user_password'],
    ({ variables: username, userNotes }) =>
      resetUserPassword(host!, username, userNotes).then(response => {
        void queryClient.invalidateQueries(getUsersQueryKey(host))
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    resetUserPassword: mutation.mutateAsync,
  }
}
