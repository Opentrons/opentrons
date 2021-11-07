import { usePlayRunMutation, usePauseRunMutation, useStopRunMutation } from '..'

interface UseRunActionMutations {
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
}

export function useRunActionMutations(runId: string): UseRunActionMutations {
  const { playRun } = usePlayRunMutation(runId)

  const { pauseRun } = usePauseRunMutation(runId)

  const { stopRun } = useStopRunMutation()

  return { playRun, pauseRun, stopRun: () => stopRun(runId) }
}
