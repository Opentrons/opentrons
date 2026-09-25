import { useMutation, useQueryClient } from 'react-query'

import { deleteAllLabwareOffsets } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'

export type UseDeleteAllLabwareOffsetsMutationResult = UseMutationResult<
  null,
  unknown,
  void
> & {
  deleteAllLabwareOffsets: UseMutateFunction<null>
}

export function useDeleteAllLabwareOffsetsMutation(): UseDeleteAllLabwareOffsetsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  // Directly calling useMutation is deprecated in the codebase. Update this to useDocumentedMutation before using this hook.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation<null, unknown>(() =>
    deleteAllLabwareOffsets(host!).then(response => {
      queryClient
        .invalidateQueries(getQueryKey(host, 'labwareOffsets'))
        .catch((e: Error) => {
          console.error(`error invalidating labwareOffsets query: ${e.message}`)
        })
      return response.data.data
    })
  )

  return {
    ...mutation,
    deleteAllLabwareOffsets: mutation.mutate,
  }
}
