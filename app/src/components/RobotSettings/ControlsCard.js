// @flow
// "Robot Controls" card
import * as React from 'react'
import {connect} from 'react-redux'

import {
  fetchRobotLights,
  setRobotLights,
  makeGetRobotLights
} from '../../http-api-client'

import {RefreshCard} from '@opentrons/components'
import {LabeledToggle, LabeledButton} from '../controls'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

type OP = Robot

type SP = {
  lightsOn: boolean,
}

type DP = {
  dispatch: Dispatch
}

type Props = OP & SP & {
  fetchLights: () => mixed,
  toggleLights: () => mixed
}

const TITLE = 'Robot Controls'

export default connect(makeMakeStateToProps, null, mergeProps)(ControlsCard)

function ControlsCard (props: Props) {
  const {name, lightsOn, fetchLights, toggleLights} = props

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
        buttonProps={{disabled: true, children: 'Home'}}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
    </RefreshCard>
  )
}

function makeMakeStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotLights = makeGetRobotLights()

  return (state, ownProps) => {
    const lights = getRobotLights(state, ownProps)
    const lightsOn = !!(lights && lights.response && lights.response.on)

    return {lightsOn}
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {lightsOn} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...ownProps,
    ...stateProps,
    fetchLights: () => dispatch(fetchRobotLights(ownProps)),
    toggleLights: () => dispatch(setRobotLights(ownProps, !lightsOn))
  }
}
