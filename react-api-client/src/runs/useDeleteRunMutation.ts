import { useMutation, useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse } from '@opentrons/api-client'

export type UseDeleteRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  deleteRun: UseMutateFunction<EmptyResponse, unknown, string>
}

export type UseDeleteRunMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export function useDeleteRunMutation(
  options: UseDeleteRunMutationOptions = {}
): UseDeleteRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (runId: string) =>
      deleteRun(host!, runId).then(response => {
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
