import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'
import { type DocumentationState } from '@opentrons/react-api-client/src/acm/types'

import { getCurrentUsernameForLocalRobot } from '/app/redux/robot-auth'

import { isDocumentationReportValid } from '../../../resources/access-control/utils'
import { requireDocumentation } from './requireDocumentation'

import type {
  DocumentationReport,
  DocumentedActionKind,
} from '../../../resources/access-control/types'

/**
 * API for the access-control gate.
 *
 *  Runs the access-control gate and returns the following states:
 *   1. If access control is disabled on the robot, the gate returns { accessControlEnabled: false }
 *   2. If access control is enabled and documentation is provided from state, the gate returns the provided docreport
 *   3. If access control is enabled and documentation is not provided or is invalid, the gate returns a function that, when invoked,
 *   opens the documentation modal and returns the documentation report
 *
 *  This documentation state is designed to be passed along to the useDocumentedMutation hook.
 *
 */
export function useGuardedAction(
  actionsToDocument: DocumentedActionKind[],
  docreport?: DocumentationReport
): DocumentationState {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const currentUsername = useSelector(getCurrentUsernameForLocalRobot)
  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data?.accessControlEnabled ?? false

  const showDocumentationModal = useCallback(async () => {
    const docResult = await requireDocumentation(
      actionsToDocument,
      currentUsername ?? ''
    )
    return docResult
  }, [currentUsername, actionsToDocument])

  if (!accessControlEnabled) {
    return { accessControlEnabled }
  }

  if (docreport != null && isDocumentationReportValid(docreport)) {
    return { accessControlEnabled, docreport }
  }

  return {
    accessControlEnabled,
    docreport: null,
    askForDocumentation: showDocumentationModal,
  }
}
