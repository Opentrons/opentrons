import { deleteLabwareOffset } from '@opentrons/api-client'
import type { HostConfig, StoredLabwareOffset } from '@opentrons/api-client'
import { useMutation, useQueryClient } from 'react-query'
import type { UseMutateAsyncFunction, UseMutationResult } from 'react-query'
import { useHost } from '../api'

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
      deleteLabwareOffset(host as HostConfig, id).then(response => {
        queryClient
          .invalidateQueries([host, 'labwareOffsets'])
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
