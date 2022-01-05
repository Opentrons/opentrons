import { useMutation, useQueryClient } from 'react-query'
import { dismissCurrentRun } from '@opentrons/api-client'
import { useHost } from '../api'
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

export function useDismissCurrentRunMutation(
  protocolId?: string
): UseDismissCurrentRunMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<EmptyResponse, unknown, string>(runId =>
    dismissCurrentRun(host as HostConfig, runId).then(response => {
      queryClient.removeQueries([host, 'runs'])

      if (protocolId != null) {
        queryClient.removeQueries([host, 'protocols', protocolId])
      }

      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.info(`error invalidating runs query: ${e.message}`)
        )
      return response.data
    })
  )

  return {
    ...mutation,
    dismissCurrentRun: mutation.mutate,
  }
}
