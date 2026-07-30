import { useCallback, useRef } from 'react'
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
  const hostConfig = useRobotUpdateHostConfig()
  const accessToken = useAccessTokenForRobot(sessionRobotName)

  const abortRef = useRef<AbortController | null>(null)

  // There are serveral values that may change while the update is in flight,
  // so we store the latest values in refs and read them via getters inside the
  // promise pipeline.
  const accessTokenRef = useRef(accessToken)
  accessTokenRef.current = accessToken

  const { documentationState, clearDocreport } = useLinkedDocumentationState(
    ['update_robot_software', 'restart_robot'],
    sessionRobotName,
    sessionRobotName,
    hostConfig
  )

  const docsStateRef = useRef(documentationState)
  docsStateRef.current = documentationState

  const createSessionMutation = useCreateRobotUpdateSessionMutation(
    documentationState,
    {},
    hostConfig
  )
  const cancelSessionMutation = useCancelRobotUpdateSessionMutation(
    {},
    hostConfig
  )
  const commitSessionMutation = useCommitRobotUpdateSessionMutation(
    {},
    hostConfig
  )
  const restartMutation = useRestartMutation(documentationState, {}, hostConfig)

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
        getAccessToken: () => accessTokenRef.current,
        getDocumentationState: () => docsStateRef.current,
        mutations: mutationsRef.current,
        signal: abortController.signal,
      })
    },
    [clearDocreport, dispatch, store]
  )

  return { startUpdate }
}
