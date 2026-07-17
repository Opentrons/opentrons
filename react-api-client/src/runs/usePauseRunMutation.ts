import { useMutation } from 'react-query'

import { createRunAction, RUN_ACTION_TYPE_PAUSE } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { RunAction } from '@opentrons/api-client'

export type UsePauseRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  pauseRun: UseMutateFunction<RunAction, unknown, string>
}

export type UsePauseRunMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const usePauseRunMutation = (
  options: UsePauseRunMutationOptions = {}
): UsePauseRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, AxiosError, string>(
    getQueryKey(host, 'runs', RUN_ACTION_TYPE_PAUSE),
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
