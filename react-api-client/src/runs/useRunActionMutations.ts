import { useQueryClient } from 'react-query'
import {
  useHost,
  usePlayRunMutation,
  usePauseRunMutation,
  useStopRunMutation,
} from '..'

interface UseRunActionMutations {
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
}

export function useRunActionMutations(runId: string): UseRunActionMutations {
  const host = useHost()
  const queryClient = useQueryClient()

  const onSuccess = (): void => {
    queryClient
      .invalidateQueries([host, 'runs', runId])
      .catch((e: Error) =>
        console.error(`error invalidating run ${runId} query: ${e.message}`)
      )
  }

  const { playRun } = usePlayRunMutation({ onSuccess })

  const { pauseRun } = usePauseRunMutation({ onSuccess })

  const { stopRun } = useStopRunMutation({ onSuccess })

  return {
    playRun: () => playRun(runId),
    pauseRun: () => pauseRun(runId),
    stopRun: () => stopRun(runId),
  }
}
