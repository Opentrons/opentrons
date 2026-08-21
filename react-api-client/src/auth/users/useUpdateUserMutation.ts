import { useQueryClient } from 'react-query'

import { updateUser } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { useHost } from '../../api'
import { getUsersQueryKey } from './useUsersQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { AuthUserResponse, UpdateUserParams } from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'

export type UseUpdateUserMutationResult = UseMutationResult<
  AuthUserResponse,
  AxiosError,
  UpdateUserParams
> & {
  updateUser: UseMutateAsyncFunction<
    AuthUserResponse,
    AxiosError,
    UpdateUserParams
  >
}

export function useUpdateUserMutation(
  documentationState: DocumentationState,
  options: UseMutationOptions<
    AuthUserResponse,
    AxiosError,
    UpdateUserParams
  > = {}
): UseUpdateUserMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation(
    documentationState,
    ['update_user'],
    ({ variables: params, userNotes }) =>
      updateUser(host!, params, userNotes).then(response => {
        void queryClient.invalidateQueries(getUsersQueryKey(host))
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    updateUser: mutation.mutateAsync,
  }
}
