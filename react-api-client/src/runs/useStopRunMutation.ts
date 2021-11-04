import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_STOP,
  createRunAction,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment mutation callback body to mock
// import { mockStopRunAction } from './__fixtures__'

export type UseStopRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  void
> & {
  stopRun: UseMutateFunction<RunAction>
}

export const useStopRunMutation = (runId: string): UseStopRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction>(
    [host, 'runs', RUN_ACTION_TYPE_STOP],
    () =>
      createRunAction(host as HostConfig, runId, {
        actionType: RUN_ACTION_TYPE_STOP,
      }).then(response => response.data)
    // Promise.resolve(mockStopRunAction)
  )
  return {
    ...mutation,
    stopRun: mutation.mutate,
  }
}
