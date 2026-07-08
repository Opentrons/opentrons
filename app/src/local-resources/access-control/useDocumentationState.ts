import { useCallback, useContext, useMemo } from 'react'

import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { useCurrentRobotName, useUsernameForRobot } from '/app/redux/robot-auth'

import { DocumentationRequiredModalContext } from './DocumentationRequiredModalContext'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
  MutationAuthenticationState,
  MutationDocumentationState,
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
export function useDocumentationState(
  docreport?: DocumentationReport,
  robotName?: string | null
): DocumentationState {
  const authSettingsQuery = useAuthSettingsQuery()
  const accessControlEnabledQuery = useAccessControlEnabledQuery()

  const foundName = useCurrentRobotName()
  const currentRobotName = robotName ?? foundName
  const currentUsername = useUsernameForRobot(currentRobotName)

  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data?.accessControlEnabled ?? false
  const requireReasonForInteraction =
    authSettingsQuery?.data?.data?.requireReasonForInteraction ?? false

  // TODO(jj): add length check for documentation report
  // const minLengthOfReasonForInteraction =
  //   authSettingsQuery?.data?.data?.minLengthOfReasonForInteraction ?? 0

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
        actionsToDocument,
        handleCancel,
        initialDocreport
      )
      return docResult
    },
    [currentRobotName, currentUsername, requireDocumentation, requireLogin]
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
