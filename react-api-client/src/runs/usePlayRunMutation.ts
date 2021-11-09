import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_PLAY,
  createRunAction,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment mutation callback body to mock
// import { mockPlayRunAction } from './__fixtures__'

export type UsePlayRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  string
> & {
  playRun: UseMutateFunction<RunAction, unknown, string>
}

export const usePlayRunMutation = (): UsePlayRunMutationResult => {
  const host = useHost()
  const mutation = useMutation<RunAction, unknown, string>(
    [host, 'runs', RUN_ACTION_TYPE_PLAY],
    (runId: string) =>
      createRunAction(host as HostConfig, runId, {
        actionType: RUN_ACTION_TYPE_PLAY,
      }).then(response => response.data)
    // Promise.resolve(mockPlayRunAction)
  )
  return {
    ...mutation,
    playRun: mutation.mutate,
  }
}
