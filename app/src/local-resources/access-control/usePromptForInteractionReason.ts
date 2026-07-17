import { useEffect, useRef, useState } from 'react'

import { useGuardedAction } from './useGuardedAction'

import type {
  DocumentationReport,
  DocumentationState,
} from '@opentrons/react-api-client'

/**
 * Immediately prompts for the interaction reason and returns a documentation State.
 *

 * Use this to prompt for a documentation report to pass between multiple mutations that only need to be prompted once.
 * e.g. maintenance run commands
 * If mutations can prompt for documentation themselves, use useGuardedAction instead.
 * 
 *  @param initialDocstate - an optional documentation state to use as a base. To be used when a flow needs to sometimes but not always prompt before the first mutation.
 *
 */
export const usePromptForInteractionReason = (
  initialDocstate?: DocumentationState
): DocumentationState => {
  const [docReport, setDocReport] = useState<DocumentationReport>()
  const docStateToUse = initialDocstate?.accessControlEnabled
    ? initialDocstate.docreport
    : docReport
  const docState = useGuardedAction(docStateToUse ?? undefined)
  const promptInFlight = useRef(false)

  useEffect(() => {
    const promptForDocumentation = async (): Promise<void> => {
      if (docState.accessControlEnabled) {
        if (docState.docreport == null && !promptInFlight.current) {
          promptInFlight.current = true
          await docState
            .askForDocumentation()
            .then(setDocReport)
            .finally(() => {
              promptInFlight.current = false
            })
        }
      }
    }
    void promptForDocumentation()
  }, [docReport, docState])

  return docState
}
