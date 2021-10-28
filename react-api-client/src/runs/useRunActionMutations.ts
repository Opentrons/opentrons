import {
  HostConfig,
  RunAction,
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_ACTION_TYPE_STOP,
  createRunAction,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'
// TODO(bh, 10-27-2021): temp mock returns til fully wired. uncomment mutation callback body to mock
// import {
//   mockPlayRunAction,
//   mockPauseRunAction,
//   mockStopRunAction,
// } from './__fixtures__'

export type RunActionMutation = UseMutateFunction<RunAction>

export type UsePlayRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  void
> & {
  playRun: RunActionMutation
}

export type UsePauseRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  void
> & {
  pauseRun: RunActionMutation
}

export type UseCancelRunMutationResult = UseMutationResult<
  RunAction,
  unknown,
  void
> & {
  cancelRun: RunActionMutation
}

interface UseRunActionMutations {
  usePlayRunMutation: () => UsePlayRunMutationResult
  usePauseRunMutation: () => UsePauseRunMutationResult
  useCancelRunMutation: () => UseCancelRunMutationResult
}

export function useRunActionMutations(): UseRunActionMutations {
  const usePlayRunMutation = (): UsePlayRunMutationResult => {
    const host = useHost()
    const mutation = useMutation<RunAction>(
      ['run', RUN_ACTION_TYPE_PLAY, host],
      () =>
        createRunAction(host as HostConfig, {
          actionType: RUN_ACTION_TYPE_PLAY,
        }).then(response => response.data)
      // Promise.resolve(mockPlayRunAction)
    )
    return {
      ...mutation,
      playRun: mutation.mutate,
    }
  }

  const usePauseRunMutation = (): UsePauseRunMutationResult => {
    const host = useHost()
    const mutation = useMutation<RunAction>(
      ['run', RUN_ACTION_TYPE_PAUSE, host],
      () =>
        createRunAction(host as HostConfig, {
          actionType: RUN_ACTION_TYPE_PAUSE,
        }).then(response => response.data)
      // Promise.resolve(mockPauseRunAction)
    )
    return {
      ...mutation,
      pauseRun: mutation.mutate,
    }
  }

  const useCancelRunMutation = (): UseCancelRunMutationResult => {
    const host = useHost()
    const mutation = useMutation<RunAction>(
      ['run', RUN_ACTION_TYPE_STOP, host],
      () =>
        createRunAction(host as HostConfig, {
          actionType: RUN_ACTION_TYPE_STOP,
        }).then(response => response.data)
      // Promise.resolve(mockStopRunAction)
    )
    return {
      ...mutation,
      cancelRun: mutation.mutate,
    }
  }

  return { usePlayRunMutation, usePauseRunMutation, useCancelRunMutation }
}
