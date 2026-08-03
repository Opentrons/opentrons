import { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

import {
  useCancelRobotUpdateSessionMutation,
  useCommitRobotUpdateSessionMutation,
  useCreateRobotUpdateSessionMutation,
  useRestartMutation,
} from '@opentrons/react-api-client'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import {
  clearRobotUpdateSession,
  startRobotUpdate,
} from '/app/redux/robot-update'
import { getRobotUpdateSessionRobotName } from '/app/redux/robot-update/selectors'

import { runRobotUpdateFlow } from './runRobotUpdateFlow'
import { useRobotUpdateHostConfig } from './useRobotUpdateHostConfig'

import type { HostConfig } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'
import type { Dispatch, State } from '/app/redux/types'

/**
 * Owns robot software update apply-flow wiring.
 */
export function useRobotUpdateOrchestrator(): {
  startUpdate: (robotName: string, systemFile?: string) => void
} {
  const dispatch = useDispatch<Dispatch>()
  const store = useStore<State>()
  const sessionRobotName = useSelector(getRobotUpdateSessionRobotName)
  const baseHostConfig = useRobotUpdateHostConfig()
  const accessToken = useAccessTokenForRobot(sessionRobotName)

  const abortRef = useRef<AbortController | null>(null)

  // Values that may change mid-flow. Read via getters.
  const accessTokenRef = useRef(accessToken)
  accessTokenRef.current = accessToken

  const unauthenticatedHostConfig = useMemo(
    () => (baseHostConfig == null ? null : withoutAccessToken(baseHostConfig)),
    [baseHostConfig]
  )

  const { documentationState, clearDocreport } = useLinkedDocumentationState(
    ['update_robot_software', 'restart_robot'],
    sessionRobotName,
    sessionRobotName,
    unauthenticatedHostConfig
  )

  const docsStateRef = useRef(documentationState)
  docsStateRef.current = documentationState

  const hostConfigReadyRef = useRef(false)
  hostConfigReadyRef.current = unauthenticatedHostConfig != null

  // Only attach the bearer token when access control is actually enabled.
  const mutationHostConfig = useMemo(() => {
    if (baseHostConfig == null) {
      return null
    }
    return shouldUseAccessToken(documentationState)
      ? baseHostConfig
      : withoutAccessToken(baseHostConfig)
  }, [baseHostConfig, documentationState])

  const createSessionMutation = useCreateRobotUpdateSessionMutation(
    documentationState,
    {},
    mutationHostConfig
  )
  const cancelSessionMutation = useCancelRobotUpdateSessionMutation(
    documentationState,
    {},
    mutationHostConfig
  )
  const commitSessionMutation = useCommitRobotUpdateSessionMutation(
    documentationState,
    {},
    mutationHostConfig
  )
  const restartMutation = useRestartMutation(
    documentationState,
    {},
    mutationHostConfig
  )

  const mutationsRef = useRef({
    createSession: createSessionMutation.mutateAsync,
    cancelSession: cancelSessionMutation.mutateAsync,
    commitSession: commitSessionMutation.mutateAsync,
    restartRobot: () => restartMutation.mutateAsync(undefined),
  })
  mutationsRef.current = {
    createSession: createSessionMutation.mutateAsync,
    cancelSession: cancelSessionMutation.mutateAsync,
    commitSession: commitSessionMutation.mutateAsync,
    restartRobot: () => restartMutation.mutateAsync(undefined),
  }

  const startUpdate = useCallback(
    (robotName: string, systemFile?: string) => {
      abortRef.current?.abort()
      const abortController = new AbortController()
      abortRef.current = abortController

      clearDocreport()
      dispatch(clearRobotUpdateSession())
      dispatch(startRobotUpdate(robotName, systemFile ?? null))

      void runRobotUpdateFlow({
        store,
        dispatch,
        robotName,
        systemFile: systemFile ?? null,
        getAccessToken: () => {
          if (!shouldUseAccessToken(docsStateRef.current)) {
            return null
          }
          return accessTokenRef.current
        },
        getDocumentationState: () => docsStateRef.current,
        isHostConfigReady: () => hostConfigReadyRef.current,
        getMutations: () => mutationsRef.current,
        signal: abortController.signal,
      })
    },
    [clearDocreport, dispatch, store]
  )

  return { startUpdate }
}

function withoutAccessToken(hostConfig: HostConfig): HostConfig {
  return { ...hostConfig, token: null }
}

function shouldUseAccessToken(documentationState: DocumentationState): boolean {
  return (
    !documentationState.isLoading && documentationState.accessControlEnabled
  )
}
