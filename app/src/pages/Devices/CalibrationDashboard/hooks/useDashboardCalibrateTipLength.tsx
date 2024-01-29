import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { Portal } from '../../../../App/portal'
import { WizardHeader } from '../../../../molecules/WizardHeader'
import { LegacyModalShell } from '../../../../molecules/LegacyModal'
import { CalibrateTipLength } from '../../../../organisms/CalibrateTipLength'
import { AskForCalibrationBlockModal } from '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import { LoadingState } from '../../../../organisms/CalibrationPanels'
import * as RobotApi from '../../../../redux/robot-api'
import * as Sessions from '../../../../redux/sessions'
import { tipLengthCalibrationStarted } from '../../../../redux/analytics'
import { getHasCalibrationBlock } from '../../../../redux/config'
import { getTipLengthCalibrationSession } from '../../../../redux/sessions/tip-length-calibration/selectors'

import type { RequestState } from '../../../../redux/robot-api/types'
import type {
  SessionCommandString,
  TipLengthCalibrationSession,
  TipLengthCalibrationSessionParams,
} from '../../../../redux/sessions/types'
import type { State } from '../../../../redux/types'

// tip length calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export interface DashboardTipLengthCalInvokerProps {
  params: Pick<TipLengthCalibrationSessionParams, 'mount'> &
    Partial<Omit<TipLengthCalibrationSessionParams, 'mount'>>
  hasBlockModalResponse: boolean | null
  invalidateHandler?: () => void
}

export type DashboardCalTipLengthInvoker = (
  props: DashboardTipLengthCalInvokerProps
) => void

export function useDashboardCalibrateTipLength(
  robotName: string
): [DashboardCalTipLengthInvoker, JSX.Element | null] {
  const createRequestId = React.useRef<string | null>(null)
  const trackedRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const sessionParams = React.useRef<
    | (Pick<TipLengthCalibrationSessionParams, 'mount'> &
        Partial<Omit<TipLengthCalibrationSessionParams, 'mount'>>)
    | null
  >(null)
  const invalidateHandlerRef = React.useRef<(() => void) | undefined>()
  const dispatch = useDispatch()
  const { t } = useTranslation('robot_calibration')

  const sessionType = Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
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
  const [showCalBlockModal, setShowCalBlockModal] = React.useState<
    boolean | null
  >(null)

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

  let Wizard: JSX.Element | null = (
    <Portal level="top">
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
          closePrompt={() => setShowCalBlockModal(false)}
        />
      ) : null}
      {startingSession ? (
        <LegacyModalShell
          width="47rem"
          header={<WizardHeader title={t('tip_length_calibration')} />}
        >
          <LoadingState />
        </LegacyModalShell>
      ) : null}
      <CalibrateTipLength
        session={tipLengthCalibrationSession}
        robotName={robotName}
        showSpinner={showSpinner}
        dispatchRequests={dispatchRequests}
        isJogging={isJogging}
        offsetInvalidationHandler={invalidateHandlerRef.current}
        allowChangeTipRack={sessionParams.current?.tipRackDefinition == null}
      />
    </Portal>
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
