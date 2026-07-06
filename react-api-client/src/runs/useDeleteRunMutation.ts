import { useMutation, useQueryClient } from 'react-query'

import { deleteRun } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { DeleteRunData, EmptyResponse } from '@opentrons/api-client'

export interface DeleteRunParams {
  runId: string
  settings: DeleteRunData
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
  options: UseDeleteRunMutationOptions = {}
): UseDeleteRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, DeleteRunParams>(
    ({ runId, settings }) =>
      deleteRun(host!, runId, settings).then(response => {
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
