// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {selectors as robotSelectors} from '../../robot'
import {
  startDiscovery,
  getScanning,
  getUnreachableRobots,
} from '../../discovery'

import {SidePanel} from '@opentrons/components'
import RobotList from './RobotList'
import RobotItem from './RobotItem'
import ScanStatus from './ScanStatus'
import UnreachableRobotItem from './UnreachableRobotItem'

import type {UnreachableRobot} from '../../discovery'

type StateProps = {
  robots: Array<Robot>,
  unreachableRobots: Array<UnreachableRobot>,
  found: boolean,
  isScanning: boolean,
}

type DispatchProps = {
  onScanClick: () => mixed,
}

type Props = StateProps & DispatchProps

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectPanel)

function ConnectPanel (props: Props) {
  return (
    <SidePanel title="Robots">
      <ScanStatus {...props} />
      <RobotList>
        {props.robots.map(robot => <RobotItem key={robot.name} {...robot} />)}
        {props.unreachableRobots.map(robot => (
          <UnreachableRobotItem key={robot.name} {...robot} />
        ))}
        {/*
          {props.connectableRobots.map((robot) => (
            <RobotItem key={robot.name} {...robot} />
          ))}
          {props.reachableRobots.map((robot) => (
            <RobotItem key={robot.name} {...robot} />
          ))}
        */}
      </RobotList>
    </SidePanel>
  )
}

function mapStateToProps (state: State): StateProps {
  const robots = robotSelectors.getDiscovered(state)
  return {
    robots,
    unreachableRobots: getUnreachableRobots(state),
    found: robots.length > 0,
    isScanning: getScanning(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch): DispatchProps {
  return {
    onScanClick: () => dispatch(startDiscovery()),
  }
}
