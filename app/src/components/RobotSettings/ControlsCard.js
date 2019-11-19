// @flow
// "Robot Controls" card
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

import {
  home,
  fetchRobotLights,
  setRobotLights,
  makeGetRobotLights,
  startDeckCalibration,
} from '../../http-api-client'

import { restartRobot } from '../../robot-admin'
import { selectors as robotSelectors } from '../../robot'
import { CONNECTABLE } from '../../discovery'

import {
  RefreshCard,
  LabeledToggle,
  LabeledButton,
} from '@opentrons/components'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type OP = {|
  robot: ViewableRobot,
  calibrateDeckUrl: string,
|}

type SP = {|
  lightsOn: boolean,
  homeEnabled: boolean,
  restartEnabled: boolean,
|}

type DP = {|
  dispatch: Dispatch,
|}

type Props = {
  ...OP,
  ...SP,
  homeAll: () => mixed,
  restartRobot: () => mixed,
  fetchLights: () => mixed,
  toggleLights: () => mixed,
  start: () => mixed,
}

const TITLE = 'Robot Controls'

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  makeMakeStateToProps,
  null,
  mergeProps
)(ControlsCard)

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."

function ControlsCard(props: Props) {
  const {
    lightsOn,
    fetchLights,
    toggleLights,
    homeAll,
    homeEnabled,
    restartRobot,
    restartEnabled,
    start,
  } = props
  const { name, status } = props.robot
  const disabled = status !== CONNECTABLE

  return (
    <RefreshCard
      title={TITLE}
      watch={name}
      refresh={fetchLights}
      disabled={disabled}
    >
      <LabeledButton
        label="Calibrate deck"
        buttonProps={{
          onClick: start,
          disabled: disabled,
          children: 'Calibrate',
        }}
      >
        <p>{CALIBRATE_DECK_DESCRIPTION}</p>
      </LabeledButton>
      <LabeledButton
        label="Home all axes"
        buttonProps={{
          onClick: homeAll,
          disabled: disabled || !homeEnabled,
          children: 'Home',
        }}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
      <LabeledButton
        label="Restart robot"
        buttonProps={{
          onClick: restartRobot,
          disabled: disabled || !restartEnabled,
          children: 'Restart',
        }}
      >
        <p>Restart robot.</p>
      </LabeledButton>
      <LabeledToggle label="Lights" toggledOn={lightsOn} onClick={toggleLights}>
        <p>Control lights on deck.</p>
      </LabeledToggle>
    </RefreshCard>
  )
}

function makeMakeStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotLights = makeGetRobotLights()

  return (state, ownProps) => {
    const { robot } = ownProps
    const lights = getRobotLights(state, robot)
    const isRunning = robotSelectors.getIsRunning(state)

    return {
      lightsOn: !!(lights && lights.response && lights.response.on),
      homeEnabled: robot.connected === true && !isRunning,
      restartEnabled: robot.connected === true && !isRunning,
    }
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { robot, calibrateDeckUrl } = ownProps
  const { lightsOn } = stateProps
  const { dispatch } = dispatchProps

  return {
    ...ownProps,
    ...stateProps,
    homeAll: () => dispatch(home(robot)),
    restartRobot: () => dispatch(restartRobot(robot)),
    fetchLights: () => dispatch(fetchRobotLights(robot)),
    toggleLights: () => dispatch(setRobotLights(robot, !lightsOn)),
    start: () =>
      dispatch(startDeckCalibration(robot)).then(() =>
        dispatch(push(calibrateDeckUrl))
      ),
  }
}
