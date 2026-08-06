import { useQueryClient } from 'react-query'

import {
  useHost,
  usePauseRunMutation,
  usePlayRunMutation,
  useResumeRunFromRecoveryAssumingFalsePositiveMutation,
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
} from '..'
import { getQueryKey } from '../api'

import type { DocumentationState } from '../accessControl'

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

export function useRunActionMutations(
  runId: string,
  documentationState: DocumentationState
): UseRunActionMutations {
  const host = useHost()
  const queryClient = useQueryClient()

  const onSuccess = (): void => {
    queryClient
      .invalidateQueries(getQueryKey(host, 'runs', runId))
      .catch((e: Error) => {
        console.error(`error invalidating run ${runId} query: ${e.message}`)
      })
  }

  const { playRun, isLoading: isPlayRunActionLoading } = usePlayRunMutation(
    documentationState,
    [],
    {
      onSuccess,
    }
  )

  const { pauseRun, isLoading: isPauseRunActionLoading } = usePauseRunMutation(
    documentationState,
    {
      onSuccess,
    }
  )

  const { stopRun, isLoading: isStopRunActionLoading } =
    useStopRunMutation(documentationState)

  const {
    resumeRunFromRecovery,
    isLoading: isResumeRunFromRecoveryActionLoading,
  } = useResumeRunFromRecoveryMutation(documentationState)

  const {
    resumeRunFromRecoveryAssumingFalsePositive,
    isLoading: isResumeRunFromRecoveryAssumingFalsePositiveActionLoading,
  } = useResumeRunFromRecoveryAssumingFalsePositiveMutation(documentationState)

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
