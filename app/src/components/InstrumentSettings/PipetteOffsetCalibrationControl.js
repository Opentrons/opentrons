// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'
import { SecondaryBtn, SPACING_2 } from '@opentrons/components'

import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import type { State } from '../../types'
import type { SessionCommandString } from '../../sessions/types'
import type { Mount } from '../../pipettes/types'
import type { RequestState } from '../../robot-api/types'

import { Portal } from '../portal'
import { CalibratePipetteOffset } from '../CalibratePipetteOffset'

type Props = {|
  robotName: string,
  mount: Mount,
|}

// pipette calibration commands for which the full page spinner should not appear
const spinnerCommandBlockList: Array<SessionCommandString> = [
  Sessions.sharedCalCommands.JOG,
]

const BUTTON_TEXT = 'Calibrate offset'

export function PipetteOffsetCalibrationControl(props: Props): React.Node {
  const { robotName, mount } = props

  const [showWizard, setShowWizard] = React.useState(false)

  const trackedRequestId = React.useRef<string | null>(null)
  const deleteRequestId = React.useRef<string | null>(null)

  const [dispatchRequests, requestIds] = RobotApi.useDispatchApiRequests(
    dispatchedAction => {
      if (
        dispatchedAction.type !== Sessions.CREATE_SESSION_COMMAND ||
        !spinnerCommandBlockList.includes(
          dispatchedAction.payload.command.command
        )
      ) {
        trackedRequestId.current = dispatchedAction.meta.requestId
      }
      if (
        dispatchedAction.type === Sessions.DELETE_SESSION &&
        pipOffsetCalSession?.id === dispatchedAction.payload.sessionId
      ) {
        deleteRequestId.current = dispatchedAction.meta.requestId
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

  const requestState = useSelector((state: State) => {
    const reqId = last(requestIds) ?? null
    return reqId ? RobotApi.getRequestById(state, reqId) : null
  })
  const requestStatus = requestState?.status ?? null

  // TODO: BC 2020-08-17 specifically track the success of the session response
  React.useEffect(() => {
    if (requestStatus === RobotApi.SUCCESS) setShowWizard(true)
    if (shouldClose) {
      setShowWizard(false)
      deleteRequestId.current = null
    }
  }, [requestStatus, shouldClose])

  const handleStartPipOffsetCalSession = () => {
    dispatchRequests(
      Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
        { mount }
      )
    )
  }

  const pipOffsetCalSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
    ) {
      return session
    }
    return null
  })

  return (
    <>
      <SecondaryBtn
        width="11rem"
        marginTop={SPACING_2}
        padding={SPACING_2}
        onClick={handleStartPipOffsetCalSession}
      >
        {BUTTON_TEXT}
      </SecondaryBtn>
      {showWizard && (
        <Portal>
          <CalibratePipetteOffset
            session={pipOffsetCalSession}
            robotName={robotName}
            closeWizard={() => setShowWizard(false)}
            showSpinner={showSpinner}
            dispatchRequests={dispatchRequests}
          />
        </Portal>
      )}
    </>
  )
}
