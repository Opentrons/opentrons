import { useQueryClient } from 'react-query'

import { deleteUser } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { useHost } from '../../api'
import { getUsersQueryKey } from './useUsersQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'

export type UseDeleteUserMutationResult = UseMutationResult<
  EmptyResponse,
  AxiosError,
  string
> & {
  deleteUser: UseMutateAsyncFunction<EmptyResponse, AxiosError, string>
}

export function useDeleteUserMutation(
  documentationState: DocumentationState,
  options: UseMutationOptions<EmptyResponse, AxiosError, string> = {}
): UseDeleteUserMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation(
    documentationState,
    ['delete_user'],
    ({ variables: username, userNotes }) =>
      deleteUser(host!, username, userNotes).then(response => {
        void queryClient.invalidateQueries(getUsersQueryKey(host))
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    deleteUser: mutation.mutateAsync,
  }
}
