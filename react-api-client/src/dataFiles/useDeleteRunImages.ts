import { useQueryClient } from 'react-query'

import { deleteRunImages } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseDeleteRunImagesMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  deleteRunImages: UseMutateFunction<EmptyResponse, unknown, string>
}

export type UseDeleteRunImagesMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export function useDeleteRunImages(
  documentationState: DocumentationState,
  options: UseDeleteRunImagesMutationOptions = {}
): UseDeleteRunImagesMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<EmptyResponse, unknown, string>(
    documentationState,
    ['delete_run_images'],
    ({ variables: runId, userNotes }: DocumentedMutationParameters<string>) =>
      deleteRunImages(host!, runId, userNotes).then(response => {
        queryClient.invalidateQueries(getQueryKey(host, 'dataFiles', runId))
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    deleteRunImages: mutation.mutate,
  }
}
