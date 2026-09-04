import { useCallback } from 'react'
import { useStore } from 'react-redux'

import { DocumentedMutationError } from '@opentrons/react-api-client'

import { getUsernameForRobot, useCurrentRobotName } from '/app/redux/robot-auth'

import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type { State } from '/app/redux/types'

type AccessControlEnabledState = Extract<
  DocumentationState,
  { accessControlEnabled: true }
>

export interface EnsureAuditLogAuthorizationParams {
  documentationState: DocumentationState
  actionsToDocument: DocumentedAction[]
  robotName: string | null
  getUsername: () => string | null
}

/**
 * Require a login (and documentation, if needed) before an audit-log download.
 */
export function useEnsureAuditLogAuthorization(
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[]
): () => Promise<void> {
  const store = useStore<State>()
  const robotName = useCurrentRobotName()

  return useCallback(
    () =>
      ensureAuditLogAuthorization({
        documentationState,
        actionsToDocument,
        robotName,
        getUsername: () => getUsernameForRobot(store.getState(), robotName),
      }),
    [actionsToDocument, documentationState, robotName, store]
  )
}

function ensureAuditLogAuthorization({
  documentationState,
  actionsToDocument,
  robotName,
  getUsername,
}: EnsureAuditLogAuthorizationParams): Promise<void> {
  if (documentationState.isLoading) {
    return Promise.reject(new DocumentedMutationError('access_control_loading'))
  }
  if (!documentationState.accessControlEnabled) {
    return Promise.resolve()
  }
  if (robotName == null) {
    return Promise.reject(
      new Error('Unable to authorize audit log download: no robot selected')
    )
  }

  return requireUsername(documentationState, getUsername).then(username =>
    requireDocumentation(documentationState, actionsToDocument, username)
  )
}

function requireUsername(
  documentationState: AccessControlEnabledState,
  getUsername: () => string | null
): Promise<string> {
  const currentUsername = getUsername()
  if (currentUsername != null && currentUsername.length > 0) {
    return Promise.resolve(currentUsername)
  }

  return documentationState.askForLogin().then(loginResult => {
    const loggedInUsername = loginResult?.username ?? ''
    if (loggedInUsername.length === 0) {
      return Promise.reject(new DocumentedMutationError('login_cancelled'))
    }

    return loggedInUsername
  })
}

function requireDocumentation(
  documentationState: AccessControlEnabledState,
  actionsToDocument: DocumentedAction[],
  username: string
): Promise<void> {
  if (!documentationState.reasonForInteractionRequired) {
    return Promise.resolve()
  }

  if (documentationState.docreport === '') {
    return Promise.reject(
      new DocumentedMutationError('no_documentation_report')
    )
  }

  if (documentationState.docreport != null) {
    return Promise.resolve()
  }

  return documentationState
    .askForDocumentation(actionsToDocument, undefined, undefined, username)
    .then(report => {
      if (report.length === 0) {
        return Promise.reject(
          new DocumentedMutationError('no_documentation_report')
        )
      }
    })
}
