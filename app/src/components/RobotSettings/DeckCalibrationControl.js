// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import last from 'lodash/last'
import {
  Text,
  SecondaryBtn,
  BORDER_SOLID_LIGHT,
  SPACING_2,
  useConditionalConfirm,
} from '@opentrons/components'

import { getFeatureFlags } from '../../config'
import * as RobotApi from '../../robot-api'
import * as Sessions from '../../sessions'

import type { State } from '../../types'
import type { DeckCalibrationStatus } from '../../calibration/types'

import { Portal } from '../portal'
import { TitledControl } from '../TitledControl'
import { CalibrateDeck } from '../CalibrateDeck'
import { DeckCalibrationWarning } from './DeckCalibrationWarning'
import { ConfirmStartDeckCalModal } from './ConfirmStartDeckCalModal'

type Props = {|
  robotName: string,
  buttonDisabled: boolean,
  deckCalStatus: DeckCalibrationStatus | null,
  startLegacyDeckCalibration: () => void,
|}

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."
const CALIBRATE_BUTTON_TEXT = 'Calibrate'
const CALIBRATE_TITLE_TEXT = 'Calibrate deck'

export function DeckCalibrationControl(props: Props): React.Node {
  const {
    robotName,
    buttonDisabled,
    deckCalStatus,
    startLegacyDeckCalibration,
  } = props

  const [showWizard, setShowWizard] = React.useState(false)

  const [dispatchRequest, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const reqId = last(requestIds) ?? null
    return reqId ? RobotApi.getRequestById(state, reqId) : null
  })
  const requestStatus = requestState?.status ?? null

  const ff = useSelector(getFeatureFlags)

  // TODO: BC 2020-08-17 specifically track the success of the session response
  React.useEffect(() => {
    if (requestStatus === RobotApi.SUCCESS) setShowWizard(true)
  }, [requestStatus])

  const handleStartDeckCalSession = () => {
    dispatchRequest(
      Sessions.ensureSession(robotName, Sessions.SESSION_TYPE_DECK_CALIBRATION)
    )
  }

  const deckCalibrationSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_DECK_CALIBRATION
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_DECK_CALIBRATION
    ) {
      return session
    }
    return null
  })

  const {
    showConfirmation: showConfirmStart,
    confirm: confirmStart,
    cancel: cancelStart,
  } = useConditionalConfirm(() => {
    handleStartDeckCalSession()
  }, true)

  const handleButtonClick = ff.enableCalibrationOverhaul
    ? confirmStart
    : startLegacyDeckCalibration

  return (
    <>
      <TitledControl
        borderBottom={BORDER_SOLID_LIGHT}
        title={CALIBRATE_TITLE_TEXT}
        description={<Text>{CALIBRATE_DECK_DESCRIPTION}</Text>}
        control={
          <SecondaryBtn
            width="9rem"
            onClick={handleButtonClick}
            disabled={buttonDisabled}
          >
            {CALIBRATE_BUTTON_TEXT}
          </SecondaryBtn>
        }
      >
        <DeckCalibrationWarning
          deckCalibrationStatus={deckCalStatus}
          marginTop={SPACING_2}
        />
      </TitledControl>
      {showConfirmStart && (
        <Portal>
          <ConfirmStartDeckCalModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        </Portal>
      )}
      {showWizard && (
        <Portal>
          <CalibrateDeck
            session={deckCalibrationSession}
            robotName={robotName}
            closeWizard={() => setShowWizard(false)}
          />
        </Portal>
      )}
    </>
  )
}
