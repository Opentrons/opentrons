import { useCallback } from 'react'

import { type PostLogMessageData } from '@opentrons/api-client'
import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import type { DocumentedAction } from '@opentrons/react-api-client'

/**
 * A hook to use to document client-side actions and log them in the audit log.
 * Only logs if access control is enabled. Prompts for documentation if enabled.
 *
 * @param handle - function that will be called when the user performs the action.
 * @param actionToLog - the action the user is shown when prompted for documentation.
 * @param logMessage - the message that will be logged to the audit log.
 * @returns
 */
export const useHandleAndLog = <T>(
  handle: (variables: T) => void,
  actionToLog: DocumentedAction,
  logMessage: PostLogMessageData | ((variables: T) => PostLogMessageData)
): ((variables: T) => void) => {
  const documentationState = useDocumentationState()
  const { postLogMessage } = usePostLogMessageMutation(
    documentationState,
    actionToLog
  )
  const handleAndLog = useCallback(
    (variables: T) => {
      if (documentationState.isLoading) return
      if (documentationState.accessControlEnabled) {
        const message =
          typeof logMessage === 'function' ? logMessage(variables) : logMessage

        postLogMessage(message, {
          onSuccess: () => {
            handle(variables)
          },
        })
      } else {
        handle(variables)
      }
    },
    [documentationState, postLogMessage, logMessage, handle]
  )

  return handleAndLog
}
