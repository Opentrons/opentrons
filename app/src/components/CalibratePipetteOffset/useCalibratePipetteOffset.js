// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'
import { getPipetteOffsetCalibrationSession } from '../../sessions/pipette-offset-calibration/selectors'

import type { State } from '../../types'
import type {
  SessionCommandString,
  PipetteOffsetCalibrationSession,
  PipetteOffsetCalibrationSessionParams,
} from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'

import { Portal } from '../portal'
import { CalibratePipetteOffset } from '../CalibratePipetteOffset'

// pipette calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

export function useCalibratePipetteOffset(
  robotName: string,
  sessionParams: $Shape<PipetteOffsetCalibrationSessionParams>,
  onComplete: (() => mixed) | null = null
): [() => void, React.Node | null] {
  const [showWizard, setShowWizard] = React.useState(false)

  const trackedRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)

  const pipOffsetCalSession: PipetteOffsetCalibrationSession | null = useSelector(
    (state: State) => {
      return getPipetteOffsetCalibrationSession(state, robotName)
    }
  )

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        pipOffsetCalSession?.id === dispatchedAction.payload.sessionId
      ) {
        deleteRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? RobotApi.getRequestById(state, trackedRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const shouldClose =
    useSelector<State, RequestState | null>(state =>
      deleteRequestId.current
        ? RobotApi.getRequestById(state, deleteRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

  const shouldOpen =
    useSelector((state: State) =>
      createRequestId.current
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.SUCCESS

  const closeWizard = React.useCallback(() => {
    onComplete && onComplete()
    setShowWizard(false)
  }, [onComplete])

  React.useEffect(() => {
    if (shouldOpen) {
      setShowWizard(true)
      createRequestId.current = null
    }
    if (shouldClose) {
      closeWizard()
      deleteRequestId.current = null
    }
  }, [shouldOpen, shouldClose, closeWizard])

  const {
    mount,
    shouldRecalibrateTipLength = false,
    hasCalibrationBlock = false,
    tipRackDefinition = null,
  } = sessionParams
  const handleStartPipOffsetCalSession = () => {
    dispatchRequests(
      Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        {
          mount,
          shouldRecalibrateTipLength,
          hasCalibrationBlock,
          tipRackDefinition,
        }
      )
    )
  }

  return [
    handleStartPipOffsetCalSession,
    showWizard ? (
      <Portal>
        <CalibratePipetteOffset
          session={pipOffsetCalSession}
          robotName={robotName}
          closeWizard={closeWizard}
          showSpinner={showSpinner}
          dispatchRequests={dispatchRequests}
        />
      </Portal>
    ) : null,
  ]
}
