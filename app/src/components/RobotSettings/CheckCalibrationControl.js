// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import {
  Icon,
  Text,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { Portal } from '../portal'
import { CheckHealthCalibration } from '../CheckCalibration'
import { TitledControl } from '../TitledControl'

import type { SessionCommandString } from '../../sessions/types'
import type { RequestState } from '../../robot-api/types'

import type { State } from '../../types'

export type CheckCalibrationControlProps = {|
  robotName: string,
  disabledReason: string | null,
|}

const CAL_HEALTH_CHECK = 'Calibration Health Check'
const CHECK_HEALTH = 'check health'
const CAL_HEALTH_CHECK_DESCRIPTION =
  'Check the calibration settings for your robot.'
const COULD_NOT_START = 'Could not start Robot Calibration Check'
const PLEASE_TRY_AGAIN =
  'Please try again or contact support if you continue to experience issues'
// pipette calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

export function CheckCalibrationControl({
  robotName,
  disabledReason,
}: CheckCalibrationControlProps): React.Node {
  const [showWizard, setShowWizard] = React.useState(false)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const trackedRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)
  const createRequestId = React.useRef<string | null>(null)

  const [dispatchRequests] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (dispatchedAction.type === Sessions.ENSURE_SESSION) {
        createRequestId.current = dispatchedAction.meta.requestId
      } else if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        checkHealthSession?.id === dispatchedAction.payload.sessionId
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

  React.useEffect(() => {
    if (shouldOpen) {
      setShowWizard(true)
      createRequestId.current = null
    }
    if (shouldClose) {
      setShowWizard(false)
      deleteRequestId.current = null
    }
  }, [shouldOpen, shouldClose])

  const handleStart = () => {
    dispatchRequests(
      Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
      )
    )
  }

  const checkHealthSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_DECK_CALIBRATION
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK
    ) {
      return session
    }
    return null
  })

  const buttonDisabled = Boolean(disabledReason) || showSpinner

  const buttonChildren = showSpinner ? (
    <Icon name="ot-spinner" height="1em" spin />
  ) : (
    CHECK
  )

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={CAL_HEALTH_CHECK}
        description={CAL_HEALTH_CHECK_DESCRIPTION}
        control={
          <SecondaryBtn
            {...targetProps}
            width="12rem"
            onClick={handleStart}
            disabled={buttonDisabled}
          >
            {buttonChildren}
          </SecondaryBtn>
        }
      >
        {disabledReason !== null && (
          <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>
        )}
      </TitledControl>
      {showWizard && (
        <Portal level="top">
          <CheckHealthCalibration
            session={checkHealthSession}
            robotName={robotName}
            closeWizard={() => setShowWizard(false)}
            dispatchRequests={dispatchRequests}
            showSpinner={showSpinner}
          />
        </Portal>
      )}
    </>
  )
}
