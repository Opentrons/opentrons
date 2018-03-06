// @flow
import * as React from 'react'
import {withRouter} from 'react-router'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import {SidePanel} from '@opentrons/components'
import RobotList from './RobotList'
import RobotItem from './RobotItem'
import ScanStatus from './ScanStatus'

type StateProps = {
  robots: Array<Robot>,
  found: boolean,
  isScanning: boolean,
}

type DispatchProps = {
  dispatch: Dispatch
}

type Props = {
  ...StateProps,
  onScanClick: () => mixed,
  robots: Array<Robot & {
    onConnectClick: () => mixed,
    onDisconnectClick: () => mixed,
  }>,
}

export default withRouter(
  connect(mapStateToProps, null, mergeProps)(ConnectPanel)
)

function ConnectPanel (props: Props) {
  return (
    <SidePanel title='Robots'>
      <div>
        <RobotList>
          {props.robots.map((robot) => (
            <RobotItem key={robot.name} {...robot} />
          ))}
        </RobotList>
        <ScanStatus {...props} />
      </div>
    </SidePanel>
  )
}

function mapStateToProps (state: State): StateProps {
  const robots = robotSelectors.getDiscovered(state)

  return {
    robots,
    found: robots.length > 0,
    isScanning: robotSelectors.getIsScanning(state)
  }
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps
): Props {
  const {found, isScanning} = stateProps
  const {dispatch} = dispatchProps

  // TODO(mc, 2017-11-13): memoize with reselect
  const robots = stateProps.robots.map((robot) => ({
    ...robot,
    onConnectClick: () => dispatch(robotActions.connect(robot.name)),
    onDisconnectClick: () => dispatch(robotActions.disconnect())
  }))

  const onScanClick = () => dispatch(robotActions.discover())

  return {found, isScanning, robots, onScanClick}
}
