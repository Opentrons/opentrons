import { useQueryClient } from 'react-query'

import { deleteLabwareOffset } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { StoredLabwareOffset } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UseDeleteLabwareOffsetMutationResult = UseMutationResult<
  StoredLabwareOffset,
  unknown,
  string
> & {
  deleteLabwareOffset: UseMutateAsyncFunction<
    StoredLabwareOffset,
    unknown,
    string
  >
}

export type UseDeleteLabwareOffsetMutationOptions = UseMutationOptions<
  StoredLabwareOffset,
  unknown,
  string
>

// Delete a single labware offset using a given id.
export function useDeleteLabwareOffsetMutation(
  documentationState: DocumentationState,
  options: UseDeleteLabwareOffsetMutationOptions = {}
): UseDeleteLabwareOffsetMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<StoredLabwareOffset, unknown, string>(
    documentationState,
    ['delete_offsets'],
    getQueryKey(host, 'labwareOffsets'),
    ({ variables: id, userNotes }: DocumentedMutationParameters<string>) =>
      deleteLabwareOffset(host!, id, userNotes).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'labwareOffsets'))
          .catch((e: Error) => {
            console.error(
              `error invalidating labwareOffsets query: ${e.message}`
            )
          })
        return response.data.data
      }),
    options
  )

  return {
    ...mutation,
    deleteLabwareOffset: mutation.mutateAsync,
  }
}
