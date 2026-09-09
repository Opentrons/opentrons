import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

import {
  useCancelRobotUpdateSessionMutation,
  useCommitRobotUpdateSessionMutation,
  useCreateRobotUpdateSessionMutation,
  useRestartMutation,
} from '@opentrons/react-api-client'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import { startRobotUpdate } from '/app/redux/robot-update'
import {
  getRobotUpdateSession,
  getRobotUpdateSessionRobotName,
} from '/app/redux/robot-update/selectors'

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
  const inFlightRef = useRef(false)
  // Ignore settled docs until the session host is ready and its AC queries
  // have loaded. Otherwise create can see a stale "AC off" snapshot while
  // hostConfig is still null. Do not resetQueries globally to force this:
  // ODD gates the whole tree on accessControlEnabled isSuccess, so a reset
  // unmounts the update UI, remounts it, and restarts the apply flow.
  const acGateRef = useRef(false)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      inFlightRef.current = false
    }
  }, [])

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
      ? withAccessToken(baseHostConfig)
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
      if (inFlightRef.current) {
        return
      }

      const previousPathPrefix = getRobotUpdateSession(
        store.getState()
      )?.pathPrefix

      abortRef.current?.abort()
      const abortController = new AbortController()
      abortRef.current = abortController
      inFlightRef.current = true

      // Cancel before clearing so host + documentation still match
      // the in-flight robot. Upload ignores AbortSignal, so this must be eager.
      if (previousPathPrefix != null) {
        void mutationsRef.current
          .cancelSession({ pathPrefix: previousPathPrefix })
          .catch(() => {})
      }

      clearDocreport()
      // Do not clearRobotUpdateSession() here: a null session looks like a
      // user cancel to UpdateRobotSoftware (afterCancel → leave the page) and
      // remounts the apply UI. START_UPDATE already resets step/error.
      dispatch(startRobotUpdate(robotName, systemFile ?? null))

      acGateRef.current = true

      void runRobotUpdateFlow({
        store,
        dispatch,
        robotName,
        systemFile: systemFile ?? null,
        getAccessToken: () => {
          if (!shouldUseAccessToken(readDocumentationState())) {
            return null
          }
          return accessTokenRef.current
        },
        getDocumentationState: readDocumentationState,
        isHostConfigReady: () => hostConfigReadyRef.current,
        getMutations: () => mutationsRef.current,
        signal: abortController.signal,
      }).finally(() => {
        if (abortRef.current === abortController) {
          inFlightRef.current = false
        }
      })

      function readDocumentationState(): DocumentationState {
        const state = docsStateRef.current
        if (!acGateRef.current) {
          return state
        }
        // Hold the gate until the session host and its AC queries have settled.
        if (!hostConfigReadyRef.current || state.isLoading) {
          return { isLoading: true }
        }
        acGateRef.current = false
        return state
      }
    },
    [clearDocreport, dispatch, store]
  )

  return { startUpdate }
}

function withoutAccessToken(hostConfig: HostConfig): HostConfig {
  return { ...hostConfig, token: null, secure: false }
}

function withAccessToken(hostConfig: HostConfig): HostConfig {
  return { ...hostConfig, secure: true }
}

function shouldUseAccessToken(documentationState: DocumentationState): boolean {
  return (
    !documentationState.isLoading && documentationState.accessControlEnabled
  )
}
