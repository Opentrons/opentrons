import { useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export interface DeleteRunParams {
  runId: string
}

export type UseDeleteRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  DeleteRunParams
> & {
  deleteRun: UseMutateFunction<EmptyResponse, unknown, DeleteRunParams>
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
    ({ variables: { runId }, userNotes }) =>
      deleteRun(host!, runId, userNotes).then(response => {
        queryClient.removeQueries(getQueryKey(host, 'runs', runId))
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    deleteRun: mutation.mutate,
  }
}
