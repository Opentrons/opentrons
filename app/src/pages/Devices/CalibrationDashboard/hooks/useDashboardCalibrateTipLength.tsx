import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { SpinnerModalPage } from '@opentrons/components'
import { getLabwareDefURI } from '@opentrons/shared-data'

import { Portal } from '../../../../App/portal'
import { CalibrateTipLength } from '../../../../organisms/CalibrateTipLength'
import { AskForCalibrationBlockModal } from '../../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import { tipLengthCalibrationStarted } from '../../../../redux/analytics'
import { getHasCalibrationBlock } from '../../../../redux/config'
import * as RobotApi from '../../../../redux/robot-api'
import * as Sessions from '../../../../redux/sessions'
import { getTipLengthCalibrationSession } from '../../../../redux/sessions/tip-length-calibration/selectors'

import type { RequestState } from '../../../../redux/robot-api/types'
import type {
  SessionCommandString,
  TipLengthCalibrationSession,
  TipLengthCalibrationSessionParams,
} from '../../../../redux/sessions/types'
import type { State } from '../../../../redux/types'
import { INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL } from '../../../../organisms/DeprecatedCalibrationPanels/constants'

// tip length calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: SessionCommandString[] = [
  Sessions.sharedCalCommands.JOG,
]

export interface DashboardTipLengthCalInvokerProps {
  params: Pick<TipLengthCalibrationSessionParams, 'mount'> &
    Partial<Omit<TipLengthCalibrationSessionParams, 'mount'>>
  hasBlockModalResponse: boolean | null
}

export type DashboardCalTipLengthInvoker = (
  props: DashboardTipLengthCalInvokerProps
) => void

export function useDashboardCalibrateTipLength(
  robotName: string,
  onComplete: (() => unknown) | null = null
): [DashboardCalTipLengthInvoker, JSX.Element | null] {
  const createRequestId = React.useRef<string | null>(null)
  const trackedRequestId = React.useRef<string | null>(null)
  const jogRequestId = React.useRef<string | null>(null)
  const sessionParams = React.useRef<
    | (Pick<TipLengthCalibrationSessionParams, 'mount'> &
        Partial<Omit<TipLengthCalibrationSessionParams, 'mount'>>)
    | null
  >(null)
  const dispatch = useDispatch()
  const { t } = useTranslation(['protocol_setup', 'shared'])

  const sessionType = Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION
  const withIntent = INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type === Sessions.ENSURE_SESSION &&
        dispatchedAction.payload.sessionType === sessionType
      ) {
        // @ts-expect-error TODO: account for possible absence of requestId on meta
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.CREATE_SESSION_COMMAND &&
        dispatchedAction.payload.command.command ===
          Sessions.sharedCalCommands.JOG
      ) {
        // @ts-expect-error TODO: account for possible absence of requestId on meta
        jogRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        // @ts-expect-error TODO: account for possible absence of meta on action, requestId on meta
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
    }
  )

  const tipLengthCalibrationSession: TipLengthCalibrationSession | null = useSelector(
    (state: State) => {
      return getTipLengthCalibrationSession(state, robotName)
    }
  )

  const configHasCalibrationBlock = null
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)

  const handleStartDashboardTipLengthCalSession: DashboardCalTipLengthInvoker = props => {
    const { params, hasBlockModalResponse } = props
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
      // TODO: fix this so it can get uncommented
      // dispatch(
      //   tipLengthCalibrationStarted(
      //     withIntent, // TODO: remove intent param entirely once calibration wizards ff is removed
      //     mount,
      //     hasCalibrationBlock,
      //     getLabwareDefURI(tipRackDefinition)
      //   )
      // )
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
        <SpinnerModalPage
          titleBar={{
            title: t('tip_length_calibration'),
            back: {
              disabled: true,
              title: t('shared:exit'),
              children: t('shared:exit'),
            },
          }}
        />
      ) : null}
      <CalibrateTipLength
        session={tipLengthCalibrationSession}
        robotName={robotName}
        showSpinner={showSpinner}
        dispatchRequests={dispatchRequests}
        isJogging={isJogging}
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
