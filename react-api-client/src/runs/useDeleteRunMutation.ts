import { useMutation, useQueryClient } from 'react-query'
import { deleteRun } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'

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
  const sanitizedHost = getSanitizedQueryKeyObject(host)

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (runId: string) =>
      deleteRun(host as HostConfig, runId).then(response => {
        queryClient.removeQueries([sanitizedHost, 'runs', runId])
        queryClient
          .invalidateQueries([sanitizedHost, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    deleteRun: mutation.mutate,
  }
}
