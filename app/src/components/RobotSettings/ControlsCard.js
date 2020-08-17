// @flow
// "Robot Controls" card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'
import {
  useInterval,
  Card,
  LabeledToggle,
  LabeledButton,
} from '@opentrons/components'

import { startDeckCalibration } from '../../http-api-client'

import {
  home,
  fetchLights,
  updateLights,
  getLightsOn,
  ROBOT,
} from '../../robot-controls'
import * as Calibration from '../../calibration'
import { restartRobot } from '../../robot-admin'
import { selectors as robotSelectors } from '../../robot'
import { CONNECTABLE } from '../../discovery'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

import { CheckCalibrationControl } from './CheckCalibrationControl'
import { DeckCalibrationControl } from './DeckCalibrationControl'

type Props = {|
  robot: ViewableRobot,
  calibrateDeckUrl: string,
|}

const TITLE = 'Robot Controls'

const CONNECT_TO_ROBOT = 'Connect to robot to control'
const PROTOCOL_IS_RUNNING = 'Protocol is running'
const BAD_DECK_CALIBRATION =
  'Bad deck calibration detected. Please perform a full deck calibration.'
const NO_DECK_CALIBRATION = 'Please perform a full deck calibration.'

const DECK_CAL_STATUS_POLL_INTERVAL = 10000

export function ControlsCard(props: Props): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const { robot, calibrateDeckUrl } = props
  const { name: robotName, status } = robot
  const lightsOn = useSelector((state: State) => getLightsOn(state, robotName))
  const isRunning = useSelector(robotSelectors.getIsRunning)
  const deckCalStatus = useSelector((state: State) => {
    return Calibration.getDeckCalibrationStatus(state, robotName)
  })
  const notConnectable = status !== CONNECTABLE
  const toggleLights = () => dispatch(updateLights(robotName, !lightsOn))
  const startLegacyDeckCalibration = () => {
    dispatch(startDeckCalibration(robot)).then(() =>
      dispatch(push(calibrateDeckUrl))
    )
  }

  React.useEffect(() => {
    dispatch(fetchLights(robotName))
  }, [dispatch, robotName])

  useInterval(
    () => dispatch(Calibration.fetchCalibrationStatus(robotName)),
    DECK_CAL_STATUS_POLL_INTERVAL,
    true
  )

  let buttonDisabledReason = null
  if (notConnectable || !robot.connected) {
    buttonDisabledReason = CONNECT_TO_ROBOT
  } else if (isRunning) {
    buttonDisabledReason = PROTOCOL_IS_RUNNING
  }

  let calCheckDisabledReason = buttonDisabledReason
  if (
    deckCalStatus === Calibration.DECK_CAL_STATUS_BAD_CALIBRATION ||
    deckCalStatus === Calibration.DECK_CAL_STATUS_SINGULARITY
  ) {
    calCheckDisabledReason = BAD_DECK_CALIBRATION
  } else if (deckCalStatus === Calibration.DECK_CAL_STATUS_IDENTITY) {
    calCheckDisabledReason = NO_DECK_CALIBRATION
  }

  const buttonDisabled = Boolean(buttonDisabledReason)

  return (
    <Card title={TITLE} disabled={notConnectable}>
      <DeckCalibrationControl
        robotName={robotName}
        buttonDisabled={buttonDisabled}
        deckCalStatus={deckCalStatus}
        startLegacyDeckCalibration={startLegacyDeckCalibration}
      />
      <LabeledButton
        label="Home all axes"
        buttonProps={{
          onClick: () => dispatch(home(robotName, ROBOT)),
          disabled: buttonDisabled,
          children: 'Home',
        }}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
      <LabeledButton
        label="Restart robot"
        buttonProps={{
          onClick: () => dispatch(restartRobot(robotName)),
          disabled: buttonDisabled,
          children: 'Restart',
        }}
      >
        <p>Restart robot.</p>
      </LabeledButton>
      <LabeledToggle
        label="Lights"
        toggledOn={Boolean(lightsOn)}
        onClick={toggleLights}
      >
        <p>Control lights on deck.</p>
      </LabeledToggle>

      {deckCalStatus !== null && (
        <CheckCalibrationControl
          robotName={robotName}
          disabledReason={calCheckDisabledReason}
        />
      )}
    </Card>
  )
}
