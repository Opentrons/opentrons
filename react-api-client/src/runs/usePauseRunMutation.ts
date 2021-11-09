import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_PAUSE,
  createRunAction,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment mutation callback body to mock
// import { mockPauseRunAction } from './__fixtures__'

export type UsePauseRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  pauseRun: UseMutateFunction<RunAction, unknown, string>
}

export const usePauseRunMutation = (): UsePauseRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, unknown, string>(
    [host, 'runs', RUN_ACTION_TYPE_PAUSE],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
        actionType: RUN_ACTION_TYPE_PAUSE,
      }).then(response => response.data)
    // Promise.resolve(mockPauseRunAction)
  )
  return {
    ...mutation,
    pauseRun: mutation.mutate,
  }
}
