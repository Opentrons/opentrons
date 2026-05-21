import { useEffect, useState } from 'react'

import { type DocumentationState } from '@opentrons/react-api-client/src/access_control/types'

import { type DocumentationReport } from '/app/resources/access-control/types'

import { useGuardedAction } from './useGuardedAction'

/**
 * Immediately prompts for the interaction reason and returns a documentation State.
 *
 * Use this to prompt for a documentation report to pass between multiple mutations that only need to be prompted once.
 * e.g. maintenance run commands
 * If mutations can prompt for documentation themselves, use useGuardedAction instead.
 */
export const usePromptForInteractionReason = (): DocumentationState => {
  const [docReport, setDocReport] = useState<DocumentationReport>()
  const docState = useGuardedAction(docReport)

  useEffect(() => {
    const promptForDocumentation = async (): Promise<void> => {
      if (docState.accessControlEnabled) {
        if (docState.docreport == null) {
          console.log(
            'usePromptForInteractionReason: prompting for documentation'
          )
          await docState.askForDocumentation().then(setDocReport)
        }
      }
    }
    void promptForDocumentation()
  }, [docReport, docState])

  return docState
}
