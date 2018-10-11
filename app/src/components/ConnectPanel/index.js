// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import orderBy from 'lodash/orderBy'

import type {State, Dispatch} from '../../types'

import {
  startDiscovery,
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../discovery'

import {SidePanel} from '@opentrons/components'
import RobotList from './RobotList'
import RobotItem from './RobotItem'
import ScanStatus from './ScanStatus'
import UnreachableRobotItem from './UnreachableRobotItem'

import type {Robot, ReachableRobot, UnreachableRobot} from '../../discovery'

type StateProps = {|
  robots: Array<Robot>,
  reachableRobots: Array<ReachableRobot>,
  unreachableRobots: Array<UnreachableRobot>,
  found: boolean,
  isScanning: boolean,
|}

type DispatchProps = {|
  onScanClick: () => mixed,
|}

type Props = {
  ...StateProps,
  ...DispatchProps,
}

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
        {props.reachableRobots.map(robot => (
          <RobotItem key={robot.name} {...robot} />
        ))}
        {props.unreachableRobots.map(robot => (
          <UnreachableRobotItem key={robot.name} {...robot} />
        ))}
      </RobotList>
    </SidePanel>
  )
}

const robotOrder = [['connected', 'local', 'name'], ['desc', 'desc', 'asc']]
const reachableOrder = [['local', 'name'], ['desc', 'asc']]
const unreachableOrder = [['name'], ['asc']]

function mapStateToProps (state: State): StateProps {
  const robots = getConnectableRobots(state)
  const reachableRobots = getReachableRobots(state)
  const unreachableRobots = getUnreachableRobots(state)

  return {
    robots: orderBy(robots, ...robotOrder),
    reachableRobots: orderBy(reachableRobots, ...reachableOrder),
    unreachableRobots: orderBy(unreachableRobots, ...unreachableOrder),
    found: robots.length > 0,
    isScanning: getScanning(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch): DispatchProps {
  return {
    onScanClick: () => dispatch(startDiscovery()),
  }
}
