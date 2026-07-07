import { useEffect, useRef, useState } from 'react'

import { useDocumentationState } from './useDocumentationState'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

/**
 * Immediately prompts for documentation and returns a documentation State.
 *

 * Use this to prompt for a documentation report to pass between multiple mutations that only need to be prompted once.
 * e.g. maintenance run commands
 * If mutations can prompt for documentation themselves, use useDocumentationState instead.
 *
 *  @param initialDocstate - an optional documentation state to use as a base. To be used when a flow needs to sometimes but not always prompt before the first mutation.
 *
 */
export const usePromptForDocumentation = (
  actionsToDocument: DocumentedAction[],
  onCancel?: () => void,
  initialDocstate?: DocumentationState
): DocumentationState => {
  const [docReport, setDocReport] = useState<DocumentationReport>()
  const docStateToUse =
    initialDocstate != null &&
    !initialDocstate.isLoading &&
    initialDocstate.accessControlEnabled &&
    initialDocstate.reasonForInteractionRequired
      ? initialDocstate.docreport
      : docReport
  const docState = useDocumentationState(docStateToUse ?? undefined)
  const promptInFlight = useRef(false)

  useEffect(() => {
    const promptForDocumentation = async (): Promise<void> => {
      if (
        !docState.isLoading &&
        docState.accessControlEnabled &&
        docState.reasonForInteractionRequired
      ) {
        if (docState.docreport == null && !promptInFlight.current) {
          promptInFlight.current = true
          await docState
            .askForDocumentation(actionsToDocument, onCancel)
            .then(setDocReport)
            .finally(() => {
              promptInFlight.current = false
            })
        }
      }
    }
    if (!docState.isLoading) {
      void promptForDocumentation()
    }
  }, [actionsToDocument, docReport, docState, onCancel])

  return docState
}
