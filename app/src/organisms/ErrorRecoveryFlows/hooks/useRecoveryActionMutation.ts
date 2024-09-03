import type { ErrorRecoveryFlowsProps } from '..'
import { useRunActionMutations } from '@opentrons/react-api-client'

export interface RecoveryActionMutationResult {
  resumeRecovery: ReturnType<typeof useRunActionMutations>['playRun']
  isResumeRecoveryLoading: ReturnType<
    typeof useRunActionMutations
  >['isPlayRunActionLoading']
}

export function useRecoveryActionMutation(
  runId: ErrorRecoveryFlowsProps['runId']
): RecoveryActionMutationResult {
  const {
    playRun: resumeRecovery,
    isPlayRunActionLoading: isResumeRecoveryLoading,
  } = useRunActionMutations(runId)

  return { resumeRecovery, isResumeRecoveryLoading }
}
