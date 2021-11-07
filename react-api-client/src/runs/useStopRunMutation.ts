import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_STOP,
  createRunAction,
} from '@opentrons/api-client'
import { useMutation } from 'react-query'
import { useHost } from '../api'

import type {
  UseMutationResult,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment mutation callback body to mock
// import { mockStopRunAction } from './__fixtures__'

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
    // Promise.resolve(mockStopRunAction)
    options
  )
  return {
    ...mutation,
    stopRun: mutation.mutate,
  }
}
