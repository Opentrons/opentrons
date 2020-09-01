// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'
import { SecondaryBtn, SPACING_2, SPACING_3 } from '@opentrons/components'

import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import type { State } from '../../types'
import type { Mount } from '../../pipettes/types'

import { Portal } from '../portal'
import { CalibratePipetteOffset } from '../CalibratePipetteOffset'

type Props = {|
  robotName: string,
  mount: Mount,
|}

const BUTTON_TEXT = 'Calibrate offset'

export function PipetteOffsetCalibrationControl(props: Props): React.Node {
  const { robotName, mount } = props

  const [showWizard, setShowWizard] = React.useState(false)

  const [dispatchRequest, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const reqId = last(requestIds) ?? null
    return reqId ? RobotApi.getRequestById(state, reqId) : null
  })
  const requestStatus = requestState?.status ?? null

  // TODO: BC 2020-08-17 specifically track the success of the session response
  React.useEffect(() => {
    if (requestStatus === RobotApi.SUCCESS) setShowWizard(true)
  }, [requestStatus])

  const handleStartPipOffsetCalSession = () => {
    dispatchRequest(
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
        css={css`
          padding: ${SPACING_2};
        `}
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
          />
        </Portal>
      )}
    </>
  )
}
