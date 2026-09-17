import { useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'

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

export interface DeleteRunParams {
  runId: string
}

export type UseDeleteRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  DeleteRunParams
> & {
  deleteRun: UseMutateAsyncFunction<EmptyResponse, unknown, DeleteRunParams>
}

export type UseDeleteRunMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  DeleteRunParams
>

export function useDeleteRunMutation(
  documentationState: DocumentationState,
  options: UseDeleteRunMutationOptions = {}
): UseDeleteRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    EmptyResponse,
    unknown,
    DeleteRunParams
  >(
    documentationState,
    ['delete_run'],
    async ({
      variables: { runId },
      userNotes,
    }: DocumentedMutationParameters<DeleteRunParams>) => {
      const response = await deleteRun(host!, runId, userNotes)
      queryClient.removeQueries(getQueryKey(host, 'runs', runId))
      await queryClient
        .invalidateQueries(getQueryKey(host, 'runs'))
        .catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
      return response.data
    },
    options
  )

  return {
    ...mutation,
    deleteRun: mutation.mutateAsync,
  }
}
