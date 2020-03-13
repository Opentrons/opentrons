// @flow
// "Robot Controls" card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'

import { startDeckCalibration } from '../../http-api-client'
import { startDeckCalibrationCheck } from '../../deck-calibration'
import { getConfig } from '../../config'
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

import { Card, LabeledToggle, LabeledButton } from '@opentrons/components'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {|
  robot: ViewableRobot,
  calibrateDeckUrl: string,
|}

const TITLE = 'Robot Controls'

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."

export function ControlsCard(props: Props) {
  const dispatch = useDispatch<Dispatch>()
  const { robot, calibrateDeckUrl } = props
  const { name: robotName, status } = robot
  const config = useSelector(getConfig)
  const enableDeckCalCheck = Boolean(config.devInternal?.enableDeckCalCheck)
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

  const checkCalibration = () => {
    dispatch(startDeckCalibrationCheck(robotName))
  }

  React.useEffect(() => {
    dispatch(fetchLights(robotName))
  }, [dispatch, robotName])

  return (
    <Card title={TITLE} disabled={notConnectable}>
      {enableDeckCalCheck && (
        <LabeledButton
          label="Deck calibration"
          buttonProps={{
            onClick: checkCalibration,
            disabled: notConnectable || !canControl,
            children: 'Check',
          }}
        >
          <p>{CALIBRATE_DECK_DESCRIPTION}</p>
        </LabeledButton>
      )}
      <LabeledButton
        label="Calibrate deck"
        buttonProps={{
          onClick: startCalibration,
          disabled: notConnectable || !canControl,
          children: 'Calibrate',
        }}
      >
        <p>{CALIBRATE_DECK_DESCRIPTION}</p>
      </LabeledButton>
      <LabeledButton
        label="Home all axes"
        buttonProps={{
          onClick: () => dispatch(home(robotName, ROBOT)),
          disabled: notConnectable || !canControl,
          children: 'Home',
        }}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
      <LabeledButton
        label="Restart robot"
        buttonProps={{
          onClick: () => dispatch(restartRobot(robotName)),
          disabled: notConnectable || !canControl,
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
    </Card>
  )
}
