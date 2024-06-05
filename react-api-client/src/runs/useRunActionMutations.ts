import { useQueryClient } from 'react-query'
import {
  useHost,
  usePlayRunMutation,
  usePauseRunMutation,
  useStopRunMutation,
  useResumeRunFromRecoveryMutation,
} from '..'
import { getSanitizedQueryKeyObject } from '../utils'

interface UseRunActionMutations {
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
  resumeRunFromRecovery: () => void
  isPlayRunActionLoading: boolean
  isPauseRunActionLoading: boolean
  isStopRunActionLoading: boolean
  isResumeRunFromRecoveryActionLoading: boolean
}

export function useRunActionMutations(runId: string): UseRunActionMutations {
  const host = useHost()
  const queryClient = useQueryClient()

  const onSuccess = (): void => {
    queryClient
      .invalidateQueries([getSanitizedQueryKeyObject(host), 'runs', runId])
      .catch((e: Error) =>
        console.error(`error invalidating run ${runId} query: ${e.message}`)
      )
  }

  const { playRun, isLoading: isPlayRunActionLoading } = usePlayRunMutation({
    onSuccess,
  })

  const { pauseRun, isLoading: isPauseRunActionLoading } = usePauseRunMutation({
    onSuccess,
  })

  const { stopRun, isLoading: isStopRunActionLoading } = useStopRunMutation()

  const {
    resumeRunFromRecovery,
    isLoading: isResumeRunFromRecoveryActionLoading,
  } = useResumeRunFromRecoveryMutation()

  return {
    playRun: () => playRun(runId),
    pauseRun: () => pauseRun(runId),
    stopRun: () => stopRun(runId),
    resumeRunFromRecovery: () => resumeRunFromRecovery(runId),
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
    isResumeRunFromRecoveryActionLoading,
  }
}
