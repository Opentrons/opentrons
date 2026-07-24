import { useCallback, useContext, useMemo } from 'react'

import {
  useAccessControlEnabledQuery,
  useAuditSettingsQuery,
} from '@opentrons/react-api-client'

import { useCurrentRobotName, useUsernameForRobot } from '/app/redux/robot-auth'

import { DocumentationRequiredModalContext } from './DocumentationRequiredModalContext'

import type { HostConfig } from '@opentrons/api-client'
import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
  MutationAuthenticationState,
  MutationDocumentationState,
} from '@opentrons/react-api-client'

/**
 * Provides a documentation state for use in the useDocumentedMutation hook.
 * Runs the appropriate auth settings queries to see what login or documentation checks are needed.
 * When a mutation runs, if no initial docreport is provided, the documentation modal will pop up.
 * Notably, the result of this modal is not stored, and only passed along to the single mutation that called it.
 * If you need to pass one docreport along to multiple mutations, use either useMaintenanceRunDocumentation or useLinkedDocumentationState.
 *
 * @param docreport - optional pre-provided documentation report
 * @param robotName - for use when this is called on the desktop but not from a /devices/<robotName> route
 * @returns a documentation state object
 */
export function useDocumentationState(
  docreport?: DocumentationReport,
  robotName?: string | null,
  hostOverride?: HostConfig | null,
  onPromptForDocumentation?: (docreport: DocumentationReport) => void,
  providedActionsToDocument?: DocumentedAction[]
): DocumentationState {
  const auditSettingsQuery = useAuditSettingsQuery(undefined, hostOverride)
  const accessControlEnabledQuery = useAccessControlEnabledQuery(
    undefined,
    hostOverride
  )

  const foundName = useCurrentRobotName()
  const currentRobotName = robotName ?? foundName
  const currentUsername = useUsernameForRobot(currentRobotName)

  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data?.accessControlEnabled ?? false
  const requireReasonForInteraction =
    auditSettingsQuery?.data?.data?.requireReasonForInteraction ?? false

  const minLengthOfReasonForInteraction =
    auditSettingsQuery?.data?.data?.minLengthOfReasonForInteraction ?? 0

  const reasonForInteractionLoading = useMemo(
    () => auditSettingsQuery?.isLoading || accessControlEnabledQuery?.isLoading,
    [accessControlEnabledQuery?.isLoading, auditSettingsQuery?.isLoading]
  )

  const reasonForInteractionRequired = useMemo(
    () => accessControlEnabled && requireReasonForInteraction,
    [accessControlEnabled, requireReasonForInteraction]
  )

  const {
    showDocumentationRequiredModal: requireDocumentation,
    showLoginModal: requireLogin,
  } = useContext(DocumentationRequiredModalContext)

  const showDocumentationModal = useCallback(
    async (
      actionsToDocument: DocumentedAction[],
      handleCancel?: () => void,
      initialDocreport?: DocumentationReport,
      usernameOverride?: string
    ) => {
      let username = usernameOverride ?? currentUsername
      if (username == null || username.length === 0) {
        console.log('calling requireLogin', currentRobotName)
        const loginResult = await requireLogin({
          robotName: currentRobotName ?? '',
        })
        username = loginResult?.username ?? ''
        // if user cancels login, cancel the whole mutation
        if (username == null || username.length === 0) {
          handleCancel?.()
          return '' as DocumentationReport
        }
      }
      const docResult = await requireDocumentation(
        username ?? '',
        providedActionsToDocument ?? actionsToDocument,
        minLengthOfReasonForInteraction,
        handleCancel,
        initialDocreport
      )
      onPromptForDocumentation?.(docResult)
      return docResult
    },
    [
      currentRobotName,
      currentUsername,
      onPromptForDocumentation,
      minLengthOfReasonForInteraction,
      providedActionsToDocument,
      requireDocumentation,
      requireLogin,
    ]
  )

  const askForLogin = useCallback(async () => {
    return await requireLogin({ robotName: currentRobotName ?? '' })
  }, [currentRobotName, requireLogin])

  const docState: DocumentationState = useMemo(() => {
    if (reasonForInteractionLoading) {
      return { isLoading: true }
    }

    if (!accessControlEnabled) {
      return { isLoading: false, accessControlEnabled: false }
    }

    const mutationAuthState: MutationAuthenticationState = {
      accessControlEnabled: true,
      loginExpired: false,
      askForLogin,
    }

    const mutationDocState: MutationDocumentationState =
      reasonForInteractionRequired
        ? {
            reasonForInteractionRequired: true,
            docreport: docreport ?? null,
            askForDocumentation: showDocumentationModal,
          }
        : {
            reasonForInteractionRequired: false,
          }

    return {
      isLoading: false,
      ...mutationAuthState,
      ...mutationDocState,
    }
  }, [
    accessControlEnabled,
    askForLogin,
    docreport,
    reasonForInteractionLoading,
    reasonForInteractionRequired,
    showDocumentationModal,
  ])

  return docState
}
