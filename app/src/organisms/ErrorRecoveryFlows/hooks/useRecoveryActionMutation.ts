import { usePlayRunMutation } from '@opentrons/react-api-client'

import type { ErrorRecoveryFlowsProps } from '..'
import type { RunAction } from '@opentrons/api-client'

export interface RecoveryActionMutationResult {
  resumeRecovery: () => Promise<RunAction>
  isResumeRecoveryLoading: ReturnType<typeof usePlayRunMutation>['isLoading']
}

export function useRecoveryActionMutation(
  runId: ErrorRecoveryFlowsProps['runId']
): RecoveryActionMutationResult {
  const {
    mutateAsync,
    isLoading: isResumeRecoveryLoading,
  } = usePlayRunMutation()

  // TOME: MAKE AN IMPLICIT ROUTE TO THE ERROR SCREEN IF THIS FAILS.
  const resumeRecovery = (): Promise<RunAction> => {
    return mutateAsync(runId)
  }

  return { resumeRecovery, isResumeRecoveryLoading }
}
