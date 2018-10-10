// @flow
// "Robot Controls" card
import * as React from 'react'
import {connect} from 'react-redux'

import {
  home,
  fetchRobotLights,
  setRobotLights,
  makeGetRobotLights,
} from '../../http-api-client'

import {selectors as robotSelectors} from '../../robot'

import {RefreshCard} from '@opentrons/components'
import {LabeledToggle, LabeledButton} from '../controls'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'

type OP = {robot: ViewableRobot}

type SP = {|
  lightsOn: boolean,
  homeEnabled: boolean,
|}

type DP = {|
  dispatch: Dispatch,
|}

type Props = {
  ...$Exact<OP>,
  ...SP,
  homeAll: () => mixed,
  fetchLights: () => mixed,
  toggleLights: () => mixed,
}

const TITLE = 'Robot Controls'

export default connect(makeMakeStateToProps, null, mergeProps)(ControlsCard)

function ControlsCard (props: Props) {
  const {lightsOn, fetchLights, toggleLights, homeAll, homeEnabled} = props
  const {name} = props.robot

  return (
    <RefreshCard title={TITLE} watch={name} refresh={fetchLights} column>
      <LabeledToggle
        label='Lights'
        toggledOn={lightsOn}
        onClick={toggleLights}
      >
        <p>Control lights on deck.</p>
      </LabeledToggle>
      <LabeledButton
        label='Home all axes'
        buttonProps={{
          onClick: homeAll,
          disabled: !homeEnabled,
          children: 'Home',
        }}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
    </RefreshCard>
  )
}

function makeMakeStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotLights = makeGetRobotLights()

  return (state, ownProps) => {
    const {robot} = ownProps
    const lights = getRobotLights(state, robot)
    const isRunning = robotSelectors.getIsRunning(state)

    return {
      lightsOn: !!(lights && lights.response && lights.response.on),
      homeEnabled: robot.connected === true && !isRunning,
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {robot} = ownProps
  const {lightsOn} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...ownProps,
    ...stateProps,
    homeAll: () => dispatch(home(robot)),
    fetchLights: () => dispatch(fetchRobotLights(robot)),
    toggleLights: () => dispatch(setRobotLights(robot, !lightsOn)),
  }
}
