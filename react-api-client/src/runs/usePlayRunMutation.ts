import { useMutation } from 'react-query'

import { createRunAction, RUN_ACTION_TYPE_PLAY } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HttpClientError, RunAction } from '@opentrons/api-client'

export type UsePlayRunMutationResult = UseMutationResult<
  RunAction,
  HttpClientError,
  string
> & {
  playRun: UseMutateFunction<RunAction, HttpClientError, string>
}

export type UsePlayRunMutationOptions = UseMutationOptions<
  RunAction,
  HttpClientError,
  string
>

export const usePlayRunMutation = (
  options: UsePlayRunMutationOptions = {}
): UsePlayRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, HttpClientError, string>(
    [host, 'runs', RUN_ACTION_TYPE_PLAY],
    (runId: string) =>
      createRunAction(host!, runId, {
        actionType: RUN_ACTION_TYPE_PLAY,
      })
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    playRun: mutation.mutate,
  }
}
