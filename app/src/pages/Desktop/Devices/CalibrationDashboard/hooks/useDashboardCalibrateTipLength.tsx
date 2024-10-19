import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ModalShell } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { WizardHeader } from '/app/molecules/WizardHeader'
import { CalibrateTipLength } from '/app/organisms/Desktop/CalibrateTipLength'
import { AskForCalibrationBlockModal } from '/app/organisms/Desktop/CalibrateTipLength/AskForCalibrationBlockModal'
import { LoadingState } from '/app/organisms/Desktop/CalibrationPanels'
import * as RobotApi from '/app/redux/robot-api'
import * as Sessions from '/app/redux/sessions'
import { tipLengthCalibrationStarted } from '/app/redux/analytics'
import { getHasCalibrationBlock } from '/app/redux/config'
import { getTipLengthCalibrationSession } from '/app/redux/sessions/tip-length-calibration/selectors'

import type { RequestState } from '/app/redux/robot-api/types'
import type {
  SessionCommandString,
  TipLengthCalibrationSession,
  TipLengthCalibrationSessionParams,
} from '/app/redux/sessions/types'
import type { State } from '/app/redux/types'
import type { DashboardCalTipLengthInvoker } from '/app/organisms/Desktop/Devices/hooks/useCalibrationTaskList'

// tip length calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export function useDashboardCalibrateTipLength(
  robotName: string
): [DashboardCalTipLengthInvoker, JSX.Element | null] {
  const createRequestId = useRef<string | null>(null)
  const trackedRequestId = useRef<string | null>(null)
  const jogRequestId = useRef<string | null>(null)
  const sessionParams = useRef<
    | (Pick<TipLengthCalibrationSessionParams, 'mount'> &
        Partial<Omit<TipLengthCalibrationSessionParams, 'mount'>>)
    | null
  >(null)
  const invalidateHandlerRef = useRef<(() => void) | undefined>()
  const dispatch = useDispatch()
  const { t } = useTranslation('robot_calibration')

  const sessionType = Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION

  const [dispatchRequests, requestIds] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type === Sessions.ENSURE_SESSION &&
        dispatchedAction.payload.sessionType === sessionType
      ) {
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

  const tipLengthCalibrationSession: TipLengthCalibrationSession | null = useSelector(
    (state: State) => {
      return getTipLengthCalibrationSession(state, robotName)
    }
  )

  const configHasCalibrationBlock = useSelector(getHasCalibrationBlock)
  const [showCalBlockModal, setShowCalBlockModal] = useState<boolean | null>(
    null
  )

  const handleStartDashboardTipLengthCalSession: DashboardCalTipLengthInvoker = props => {
    const { params, hasBlockModalResponse, invalidateHandler } = props
    invalidateHandlerRef.current = invalidateHandler
    sessionParams.current = params
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      setShowCalBlockModal(false)
      const { mount, tipRackDefinition = null } = sessionParams.current
      const hasCalibrationBlock = Boolean(
        configHasCalibrationBlock ?? hasBlockModalResponse
      )
      dispatchRequests(
        Sessions.ensureSession(robotName, sessionType, {
          mount,
          tipRackDefinition,
          hasCalibrationBlock,
        })
      )
      dispatch(
        tipLengthCalibrationStarted(
          mount,
          hasCalibrationBlock,
          'default Opentrons tip rack for pipette on mount'
        )
      )
    }
  }

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

  const isJogging =
    useSelector((state: State) =>
      jogRequestId.current
        ? RobotApi.getRequestById(state, jogRequestId.current)
        : null
    )?.status === RobotApi.PENDING

  let Wizard: JSX.Element | null = createPortal(
    <>
      {showCalBlockModal && sessionParams.current != null ? (
        <AskForCalibrationBlockModal
          onResponse={hasBlock => {
            if (sessionParams.current != null) {
              handleStartDashboardTipLengthCalSession({
                params: sessionParams.current,
                hasBlockModalResponse: hasBlock,
              })
            }
          }}
          titleBarTitle={t('tip_length_calibration')}
          closePrompt={() => {
            setShowCalBlockModal(false)
          }}
        />
      ) : null}
      {startingSession ? (
        <ModalShell
          width="47rem"
          header={<WizardHeader title={t('tip_length_calibration')} />}
        >
          <LoadingState />
        </ModalShell>
      ) : null}
      <CalibrateTipLength
        session={tipLengthCalibrationSession}
        robotName={robotName}
        showSpinner={showSpinner}
        dispatchRequests={dispatchRequests}
        requestIds={requestIds}
        isJogging={isJogging}
        offsetInvalidationHandler={invalidateHandlerRef.current}
        allowChangeTipRack={sessionParams.current?.tipRackDefinition == null}
      />
    </>,
    getTopPortalEl()
  )

  if (
    !(
      startingSession ||
      tipLengthCalibrationSession != null ||
      showCalBlockModal != null
    )
  )
    Wizard = null

  return [handleStartDashboardTipLengthCalSession, Wizard]
}
