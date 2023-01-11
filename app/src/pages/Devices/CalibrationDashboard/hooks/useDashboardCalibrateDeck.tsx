import * as React from 'react'
import { useSelector } from 'react-redux'

import * as RobotApi from '../../../../redux/robot-api'
import * as Sessions from '../../../../redux/sessions'
import { getDeckCalibrationSession } from '../../../../redux/sessions/deck-calibration/selectors'

import type { State } from '../../../../redux/types'
import type { DeckCalibrationSession } from '../../../../redux/sessions'
import type { SessionCommandString } from '../../../../redux/sessions/types'
import type { RequestState } from '../../../../redux/robot-api/types'
import { Portal } from '../../../../App/portal'
import { CalibrateDeck } from '../../../../organisms/CalibrateDeck'

// deck calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export type DashboardCalDeckInvoker = () => void

export function useDashboardCalibrateDeck(
  robotName: string,
  onComplete: (() => unknown) | null = null
): [DashboardCalDeckInvoker, JSX.Element | null] {
  const trackedRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)

  const deckCalSession: DeckCalibrationSession | null = useSelector(
    (state: State) => {
      return getDeckCalibrationSession(state, robotName)
    }
  )

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        jogRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        deckCalSession?.id === dispatchedAction.payload.sessionId
      ) {
        // @ts-expect-error(sa, 2021-05-26): avoiding src code change, use in operator to type narrow
        deleteRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  const startingSession =
    useSelector<State, RequestState | null>(state =>
      createRequestId.current
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING
  
    const shouldClose =
    useSelector<State, RequestState | null>(state =>
      deleteRequestId.current != null
        ? RobotApi.getRequestById(state, deleteRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

    React.useEffect(() => {
      if (shouldClose) {
        onComplete?.()
        deleteRequestId.current = null
      }
    }, [shouldClose, onComplete])

  const handleStartDashboardDeckCalSession: DashboardCalDeckInvoker = () => {
    dispatchRequests(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  let Wizard: JSX.Element | null = (
    <Portal level="top">
      <CalibrateDeck
        session={deckCalSession}
        robotName={robotName}
        showSpinner={showSpinner}
        dispatchRequests={dispatchRequests}
        isJogging={isJogging}
      />
    </Portal>
  )

  if (!(startingSession || deckCalSession != null)) Wizard = null

  return [handleStartDashboardDeckCalSession, Wizard]
}
