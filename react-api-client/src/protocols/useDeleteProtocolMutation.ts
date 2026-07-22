import { useQueryClient } from 'react-query'

import { deleteProtocol } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseDeleteProtocolMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  deleteProtocol: UseMutateAsyncFunction<EmptyResponse, unknown, string>
}

export type UseDeleteProtocolMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export function useDeleteProtocolMutation(
  documentationState: DocumentationState,
  options: UseDeleteProtocolMutationOptions = {}
): UseDeleteProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<EmptyResponse, unknown, string>(
    documentationState,
    ['delete_protocol'],
    ({
      variables: protocolId,
      userNotes,
    }: DocumentedMutationParameters<string>) =>
      deleteProtocol(host!, protocolId, userNotes).then(response => {
        queryClient.invalidateQueries(getQueryKey(host, 'protocols'))
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    deleteProtocol: mutation.mutateAsync,
  }
}
