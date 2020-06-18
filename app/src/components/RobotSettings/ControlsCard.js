// @flow
// "Robot Controls" card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'
import {
  Card,
  LabeledToggle,
  LabeledButton,
  BORDER_SOLID_LIGHT,
} from '@opentrons/components'

import { startDeckCalibration } from '../../http-api-client'
import { getFeatureFlags } from '../../config'

import {
  home,
  fetchLights,
  updateLights,
  getLightsOn,
  ROBOT,
} from '../../robot-controls'
import { restartRobot } from '../../robot-admin'
import { selectors as robotSelectors } from '../../robot'
import { CONNECTABLE } from '../../discovery'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'
import { TitledButton } from '../TitledButton'
import { CheckCalibrationControl } from './CheckCalibrationControl'
import { DeckCalibrationWarning } from './DeckCalibrationWarning'

type Props = {|
  robot: ViewableRobot,
  calibrateDeckUrl: string,
|}

const TITLE = 'Robot Controls'

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."

export function ControlsCard(props: Props): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const { robot, calibrateDeckUrl } = props
  const { name: robotName, status } = robot
  const ff = useSelector(getFeatureFlags)
  const lightsOn = useSelector((state: State) => getLightsOn(state, robotName))
  const isRunning = useSelector(robotSelectors.getIsRunning)

  const notConnectable = status !== CONNECTABLE
  const toggleLights = () => dispatch(updateLights(robotName, !lightsOn))
  const canControl = robot.connected && !isRunning

  const startCalibration = () => {
    dispatch(startDeckCalibration(robot)).then(() =>
      dispatch(push(calibrateDeckUrl))
    )
  }

  React.useEffect(() => {
    dispatch(fetchLights(robotName))
  }, [dispatch, robotName])

  const buttonDisabled = notConnectable || !canControl
  const calCheckDisabled = buttonDisabled || false

  const deckTransformStatus = 'OK'

  return (
    <Card title={TITLE} disabled={notConnectable}>
      <TitledButton
        borderBottom={BORDER_SOLID_LIGHT}
        title="Calibrate deck"
        description={CALIBRATE_DECK_DESCRIPTION}
        buttonProps={{
          onClick: startCalibration,
          disabled: buttonDisabled,
          children: 'Calibrate',
        }}
      >
        <DeckCalibrationWarning calibrationStatus={deckTransformStatus} />
      </TitledButton>
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

      <CheckCalibrationControl
        robotName={robotName}
        disabled={calCheckDisabled}
      />
    </Card>
  )
}
