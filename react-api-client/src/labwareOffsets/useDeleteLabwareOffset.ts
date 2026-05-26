import { useMutation, useQueryClient } from 'react-query'

import { deleteLabwareOffset } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateAsyncFunction, UseMutationResult } from 'react-query'
import type { StoredLabwareOffset } from '@opentrons/api-client'

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

// Delete a single labware offset using a given id.
export function useDeleteLabwareOffsetMutation(): UseDeleteLabwareOffsetMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<StoredLabwareOffset, unknown, string>(
    (id: string) =>
      deleteLabwareOffset(host!, id).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'labwareOffsets'))
          .catch((e: Error) => {
            console.error(
              `error invalidating labwareOffsets query: ${e.message}`
            )
          })
        return response.data.data
      })
  )

  return {
    ...mutation,
    deleteLabwareOffset: mutation.mutateAsync,
  }
}
