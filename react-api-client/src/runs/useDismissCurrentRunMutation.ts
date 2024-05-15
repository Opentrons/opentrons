import { useMutation, useQueryClient } from 'react-query'
import { dismissCurrentRun } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { HostConfig, EmptyResponse } from '@opentrons/api-client'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'

export type UseDismissCurrentRunMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  string
> & {
  dismissCurrentRun: UseMutateFunction<EmptyResponse, unknown, string>
}

export type UseDismissCurrentRunMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  string
>

export function useDismissCurrentRunMutation(): UseDismissCurrentRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const sanitizedHost = getSanitizedQueryKeyObject(host)

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (runId: string) =>
      dismissCurrentRun(host as HostConfig, runId).then(response => {
        queryClient.removeQueries([sanitizedHost, 'runs', runId])
        queryClient
          .invalidateQueries([sanitizedHost, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
        return response.data
      })
  )

  return {
    ...mutation,
    dismissCurrentRun: mutation.mutate,
  }
}
