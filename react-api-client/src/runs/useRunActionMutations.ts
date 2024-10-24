import { useQueryClient } from 'react-query'
import {
  useHost,
  usePlayRunMutation,
  usePauseRunMutation,
  useStopRunMutation,
  useResumeRunFromRecoveryMutation,
  useResumeRunFromRecoveryAssumingFalsePositiveMutation,
} from '..'

interface UseRunActionMutations {
  playRun: () => void
  pauseRun: () => void
  stopRun: () => void
  resumeRunFromRecovery: () => void
  resumeRunFromRecoveryAssumingFalsePositive: () => void
  isPlayRunActionLoading: boolean
  isPauseRunActionLoading: boolean
  isStopRunActionLoading: boolean
  isResumeRunFromRecoveryActionLoading: boolean
  isResumeRunFromRecoveryAssumingFalsePositiveActionLoading: boolean
}

export function useRunActionMutations(runId: string): UseRunActionMutations {
  const host = useHost()
  const queryClient = useQueryClient()

  const onSuccess = (): void => {
    queryClient.invalidateQueries([host, 'runs', runId]).catch((e: Error) => {
      console.error(`error invalidating run ${runId} query: ${e.message}`)
    })
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

  const {
    resumeRunFromRecoveryAssumingFalsePositive,
    isLoading: isResumeRunFromRecoveryAssumingFalsePositiveActionLoading,
  } = useResumeRunFromRecoveryAssumingFalsePositiveMutation()

  return {
    playRun: () => {
      playRun(runId)
    },
    pauseRun: () => {
      pauseRun(runId)
    },
    stopRun: () => {
      stopRun(runId)
    },
    resumeRunFromRecovery: () => {
      resumeRunFromRecovery(runId)
    },
    resumeRunFromRecoveryAssumingFalsePositive: () => {
      resumeRunFromRecoveryAssumingFalsePositive(runId)
    },
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isStopRunActionLoading,
    isResumeRunFromRecoveryActionLoading,
    isResumeRunFromRecoveryAssumingFalsePositiveActionLoading,
  }
}
