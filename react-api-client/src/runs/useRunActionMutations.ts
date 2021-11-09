import { usePlayRunMutation, usePauseRunMutation, useStopRunMutation } from '..'

interface UseRunActionMutations {
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
}

// TODO (bc, 11/8/21): Play and Pause should have the same interface as stop here.
// The hook should take no params, but the callback function should take a runId
export function useRunActionMutations(runId: string): UseRunActionMutations {
  const { playRun } = usePlayRunMutation(runId)

  const { pauseRun } = usePauseRunMutation(runId)

  const { stopRun } = useStopRunMutation()

  return { playRun, pauseRun, stopRun: () => stopRun(runId) }
}
