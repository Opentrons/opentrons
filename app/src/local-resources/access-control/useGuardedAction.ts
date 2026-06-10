import { useCallback, useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { getCurrentUsernameForLocalRobot } from '/app/redux/robot-auth'

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
 */
export function useGuardedAction(
  docreport?: DocumentationReport
): DocumentationState {
  const authSettingsQuery = useAuthSettingsQuery()
  const accessControlEnabledQuery = useAccessControlEnabledQuery()

  const currentUsername = useSelector(getCurrentUsernameForLocalRobot)
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

  const { showDocumentationRequiredModal: requireDocumentation } = useContext(
    DocumentationRequiredModalContext
  )

  const showDocumentationModal = useCallback(
    async (actionsToDocument: DocumentedAction[]) => {
      const docResult = await requireDocumentation(
        currentUsername ?? '',
        actionsToDocument
      )
      return docResult
    },
    [currentUsername, requireDocumentation]
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
