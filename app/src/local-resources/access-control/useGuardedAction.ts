import { useCallback, useContext, useMemo } from 'react'

import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { useCurrentRobotName, useCurrentUsername } from '/app/redux/robot-auth'

import { DocumentationRequiredModalContext } from './DocumentationRequiredModalContext'
import { isDocumentationReportValid } from './utils'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

/**
 * API for the access-control gate.
 *
 *  Runs the access-control gate and returns the following states:
 *   1. If access control is disabled on the robot, the gate returns { reasonForInteractionRequired: false}
 *   2. If access control is enabled and documentation is provided from state, the gate returns the provided docreport
 *   3. If access control is enabled and documentation is not provided or is invalid, the gate returns a function that, when invoked,
 *   opens the documentation modal and returns the documentation report
 *
 *  This documentation state is designed to be passed along to the useDocumentedMutation hook.
 *
 * @param docreport - optional pre-provided documentation report
 */
export function useGuardedAction(
  docreport?: DocumentationReport
): DocumentationState {
  const authSettingsQuery = useAuthSettingsQuery()
  const accessControlEnabledQuery = useAccessControlEnabledQuery()

  const currentUsername = useCurrentUsername()
  const currentRobotName = useCurrentRobotName()

  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data?.accessControlEnabled ?? false
  const requireReasonForInteraction =
    authSettingsQuery?.data?.data?.requireReasonForInteraction ?? false
  const minLengthOfReasonForInteraction =
    authSettingsQuery?.data?.data?.minLengthOfReasonForInteraction ?? 0

  const reasonForInteractionLoading = useMemo(
    () => authSettingsQuery?.isLoading || accessControlEnabledQuery?.isLoading,
    [accessControlEnabledQuery?.isLoading, authSettingsQuery?.isLoading]
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
      handleCancel?: () => void
    ) => {
      let username = currentUsername
      if (currentUsername == null || currentUsername.length === 0) {
        username = await requireLogin({ robotName: currentRobotName ?? '' })
      }
      const docResult = await requireDocumentation(
        username ?? '',
        actionsToDocument,
        handleCancel
      )
      return docResult
    },
    [currentRobotName, currentUsername, requireDocumentation, requireLogin]
  )

  const docState: DocumentationState = useMemo(() => {
    if (reasonForInteractionLoading) {
      return { isLoading: true }
    }
    if (!reasonForInteractionRequired) {
      return { reasonForInteractionRequired: false, isLoading: false }
    }

    if (
      docreport != null &&
      isDocumentationReportValid(docreport, minLengthOfReasonForInteraction)
    ) {
      return { reasonForInteractionRequired: true, docreport, isLoading: false }
    }

    return {
      reasonForInteractionRequired: true,
      docreport: null,
      askForDocumentation: showDocumentationModal,
      isLoading: false,
    }
  }, [
    docreport,
    minLengthOfReasonForInteraction,
    reasonForInteractionLoading,
    reasonForInteractionRequired,
    showDocumentationModal,
  ])

  return docState
}
