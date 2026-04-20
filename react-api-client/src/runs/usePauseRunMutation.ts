import { useMutation } from 'react-query'

import { createRunAction, RUN_ACTION_TYPE_PAUSE } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HttpClientError, RunAction } from '@opentrons/api-client'

export type UsePauseRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  pauseRun: UseMutateFunction<RunAction, unknown, string>
}

export type UsePauseRunMutationOptions = UseMutationOptions<
  RunAction,
  HttpClientError,
  string
>

export const usePauseRunMutation = (
  options: UsePauseRunMutationOptions = {}
): UsePauseRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, HttpClientError, string>(
    [host, 'runs', RUN_ACTION_TYPE_PAUSE],
    (runId: string) =>
      createRunAction(host!, runId, {
        actionType: RUN_ACTION_TYPE_PAUSE,
      })
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    pauseRun: mutation.mutate,
  }
}
