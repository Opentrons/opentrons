import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_PLAY,
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

export type UsePlayRunMutationResult = UseMutationResult<
  RunAction,
  AxiosError,
  string
> & {
  playRun: UseMutateFunction<RunAction, AxiosError, string>
}

export type UsePlayRunMutationOptions = UseMutationOptions<
  RunAction,
  AxiosError,
  string
>

export const usePlayRunMutation = (
  options: UsePlayRunMutationOptions = {}
): UsePlayRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, AxiosError, string>(
    [host, 'runs', RUN_ACTION_TYPE_PLAY],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
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
