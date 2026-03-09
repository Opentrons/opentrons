import { useMutation, useQueryClient } from 'react-query'

import { dismissCurrentRun } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { EmptyResponse, HostConfig } from '@opentrons/api-client'

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

export function useDismissCurrentRunMutation(
  options: UseDismissCurrentRunMutationOptions = {}
): UseDismissCurrentRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, string>(
    (runId: string) =>
      dismissCurrentRun(host as HostConfig, runId).then(response => {
        queryClient.removeQueries([host, 'runs', runId])
        queryClient.invalidateQueries([host, 'runs']).catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    dismissCurrentRun: mutation.mutate,
  }
}
