import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_PAUSE,
  createRunAction,
} from '@opentrons/api-client'
import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import { useHost } from '../api'

import type { AxiosError } from 'axios'

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
    [host, 'runs', RUN_ACTION_TYPE_PAUSE],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
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
