import { createRunAction, RUN_ACTION_TYPE_STOP } from '@opentrons/api-client'
import type { HostConfig, RunAction } from '@opentrons/api-client'
import { useMutation } from 'react-query'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import { useHost } from '../api'

export type UseStopRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  stopRun: UseMutateFunction<RunAction, unknown, string>
}

export type UseStopRunMutationOptions = UseMutationOptions<
  RunAction,
  unknown,
  string
>

export const useStopRunMutation = (
  options?: UseStopRunMutationOptions
): UseStopRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, unknown, string>(
    [host, 'runs', RUN_ACTION_TYPE_STOP],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
        actionType: RUN_ACTION_TYPE_STOP,
      }).then(response => response.data),
    options
  )
  return {
    ...mutation,
    stopRun: mutation.mutate,
  }
}
