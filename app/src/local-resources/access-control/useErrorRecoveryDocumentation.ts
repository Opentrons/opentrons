import { useMemo } from 'react'

import { useActionsToDocumentList } from './useActionsToDocumentList'
import { useDocumentationState } from './useDocumentationState'
import { useLinkedDocumentationState } from './useLinkedDocumentationState'

import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

export interface UseErrorRecoveryDocumentationParams {
  /** When true, the terminal resume also updates recovery policy — document both. */
  ignoreErrors: boolean
  /** Clears linked docreport when the recovery session (failed command) changes. */
  recoverySessionKey: string | null
}

export const useErrorRecoveryDocumentation = ({
  ignoreErrors,
  recoverySessionKey,
}: UseErrorRecoveryDocumentationParams): {
  documentationState: DocumentationState
  actionsToDocument: DocumentedAction[]
  addActionToDocument: (action: DocumentedAction) => void
  resumeAndHandleErrorPolicyDocState: DocumentationState
  clearResumeAndHandleErrorPolicyDocreport: () => void
} => {
  const [actionsToDocument, addActionToDocument] = useActionsToDocumentList([
    'launching_error_recovery',
  ])
  const documentationState = useDocumentationState()

  const resumeAndPolicyActions = useMemo((): DocumentedAction[] => {
    return ignoreErrors
      ? ['resume_run_from_recovery', 'update_error_recovery_policy']
      : ['resume_run_from_recovery']
  }, [ignoreErrors])

  const {
    documentationState: resumeAndHandleErrorPolicyDocState,
    clearDocreport: clearResumeAndHandleErrorPolicyDocreport,
  } = useLinkedDocumentationState(resumeAndPolicyActions, recoverySessionKey)

  return {
    documentationState,
    actionsToDocument,
    addActionToDocument,
    resumeAndHandleErrorPolicyDocState,
    clearResumeAndHandleErrorPolicyDocreport,
  }
}
