import { usePlayRunMutation, usePauseRunMutation, useStopRunMutation } from '..'

interface UseRunActionMutations {
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
}

export function useRunActionMutations(runId: string): UseRunActionMutations {
  const { playRun } = usePlayRunMutation()

  const { pauseRun } = usePauseRunMutation()

  const { stopRun } = useStopRunMutation()

  return {
    playRun: () => playRun(runId),
    pauseRun: () => pauseRun(runId),
    stopRun: () => stopRun(runId),
  }
}
