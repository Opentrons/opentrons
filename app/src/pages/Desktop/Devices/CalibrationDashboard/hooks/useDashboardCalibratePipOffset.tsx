import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ModalShell } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { WizardHeader } from '/app/molecules/WizardHeader'
import { CalibratePipetteOffset } from '/app/organisms/Desktop/CalibratePipetteOffset'
import { LoadingState } from '/app/organisms/Desktop/CalibrationPanels'
import * as RobotApi from '/app/redux/robot-api'
import * as Sessions from '/app/redux/sessions'
import { getPipetteOffsetCalibrationSession } from '/app/redux/sessions/pipette-offset-calibration/selectors'
import { pipetteOffsetCalibrationStarted } from '/app/redux/analytics'
import type { DashboardCalOffsetInvoker } from '/app/organisms/Desktop/Devices/hooks/useCalibrationTaskList'
import type { State } from '/app/redux/types'
import type {
  SessionCommandString,
  PipetteOffsetCalibrationSession,
} from '/app/redux/sessions/types'
import type { RequestState } from '/app/redux/robot-api/types'

// pipette calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function useDashboardCalibratePipOffset(
  robotName: string,
  onComplete: (() => unknown) | null = null
): [DashboardCalOffsetInvoker, JSX.Element | null] {
  const createRequestId = useRef<string | null>(null)
  const deleteRequestId = useRef<string | null>(null)
  const jogRequestId = useRef<string | null>(null)
  const spinnerRequestId = useRef<string | null>(null)
  const dispatch = useDispatch()
  const { t } = useTranslation('robot_calibration')

  const pipOffsetCalSession: PipetteOffsetCalibrationSession | null = useSelector(
    (state: State) => {
      return getPipetteOffsetCalibrationSession(state, robotName)
    }
  )

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type === Sessions.ENSURE_SESSION &&
        dispatchedAction.payload.sessionType ===
          Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
      ) {
        createRequestId.current =
          'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        pipOffsetCalSession?.id === dispatchedAction.payload.sessionId
      ) {
        deleteRequestId.current =
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
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        spinnerRequestId.current =
          'meta' in dispatchedAction && 'requestId' in dispatchedAction.meta
            ? dispatchedAction.meta.requestId ?? null
            : null
      }
    }
  )

  const startingSession =
    useSelector<State, RequestState | null>(state =>
      createRequestId.current != null
        ? RobotApi.getRequestById(state, createRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  const showSpinner =
    useSelector<State, RequestState | null>(state =>
      spinnerRequestId.current != null
        ? RobotApi.getRequestById(state, spinnerRequestId.current)
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
      jogRequestId.current != null
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  useEffect(() => {
    if (shouldClose) {
      onComplete?.()
      deleteRequestId.current = null
    }
  }, [shouldClose, onComplete])

  const handleStartDashboardPipOffsetCalSession: DashboardCalOffsetInvoker = props => {
    const { params } = props
    const {
      mount,
      shouldRecalibrateTipLength = false,
      hasCalibrationBlock = false,
      tipRackDefinition = null,
    } = params
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
    dispatch(
      pipetteOffsetCalibrationStarted(
        mount,
        hasCalibrationBlock,
        shouldRecalibrateTipLength,
        tipRackDefinition != null
          ? `${tipRackDefinition.namespace}/${tipRackDefinition.parameters.loadName}/${tipRackDefinition.version}`
          : null
      )
    )
  }

  let Wizard: JSX.Element | null = createPortal(
    startingSession ? (
      <ModalShell
        width="47rem"
        header={<WizardHeader title={t('pipette_offset_calibration')} />}
      >
        <LoadingState />
      </ModalShell>
    ) : (
      <CalibratePipetteOffset
        session={pipOffsetCalSession}
        robotName={robotName}
        showSpinner={startingSession || showSpinner}
        dispatchRequests={dispatchRequests}
        isJogging={isJogging}
      />
    ),
    getTopPortalEl()
  )

  if (!(startingSession || pipOffsetCalSession != null)) Wizard = null

  return [handleStartDashboardPipOffsetCalSession, Wizard]
}
