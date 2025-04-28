import { createRunAction, RUN_ACTION_TYPE_PLAY } from '@opentrons/api-client'
import type { HostConfig, RunAction } from '@opentrons/api-client'
import type { AxiosError } from 'axios'
import { useMutation } from 'react-query'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import { useHost } from '../api'

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
