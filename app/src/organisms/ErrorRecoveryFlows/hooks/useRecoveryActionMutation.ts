import {
  isDocumentedMutationError,
  usePlayRunMutation,
} from '@opentrons/react-api-client'

import { RECOVERY_MAP } from '../constants'

import type { RunAction } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'
import type { ErrorRecoveryFlowsProps } from '..'
import type { ERUtilsResults } from './useERUtils'

export interface RecoveryActionMutationResult {
  resumeRecovery: () => Promise<RunAction>
  isResumeRecoveryLoading: ReturnType<typeof usePlayRunMutation>['isLoading']
}

export function useRecoveryActionMutation(
  runId: ErrorRecoveryFlowsProps['runId'],
  routeUpdateActions: ERUtilsResults['routeUpdateActions'],
  documentationState: DocumentationState
): RecoveryActionMutationResult {
  const { mutateAsync, isLoading: isResumeRecoveryLoading } =
    usePlayRunMutation(documentationState)
  const { proceedToRouteAndStep } = routeUpdateActions

  const resumeRecovery = (): Promise<RunAction> => {
    return mutateAsync(runId).catch(e => {
      // User cancelled documentation/login — stay on the current screen.
      if (isDocumentedMutationError(e)) {
        return Promise.reject(e)
      }
      return proceedToRouteAndStep(
        RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE
      ).then(() => {
        throw new Error(`Could not resume recovery: ${e}`)
      })
    })
  }

  return { resumeRecovery, isResumeRecoveryLoading }
}
