// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import orderBy from 'lodash/orderBy'

import {
  startDiscovery,
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../discovery'

import type { State, Dispatch } from '../../types'

import { SidePanel } from '@opentrons/components'
import { RobotList } from './RobotList'
import { RobotItem } from './RobotItem'
import { ScanStatus } from './ScanStatus'
import { UnreachableRobotItem } from './UnreachableRobotItem'

import type {
  Robot,
  ReachableRobot,
  UnreachableRobot,
} from '../../discovery/types'

type SP = {|
  robots: Array<Robot>,
  reachableRobots: Array<ReachableRobot>,
  unreachableRobots: Array<UnreachableRobot>,
  found: boolean,
  isScanning: boolean,
|}

type DP = {| onScanClick: () => mixed |}

type Props = {| ...SP, ...DP |}

export const ConnectPanel = connect<Props, {||}, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(ConnectPanelComponent)

function ConnectPanelComponent(props: Props) {
  const {
    robots,
    reachableRobots,
    unreachableRobots,
    found,
    isScanning,
    onScanClick,
  } = props

  return (
    <SidePanel title="Robots">
      <ScanStatus {...{ found, isScanning, onScanClick }} />
      <RobotList>
        {robots.map(robot => (
          <RobotItem key={robot.name} robot={robot} />
        ))}
        {reachableRobots.map(robot => (
          <RobotItem key={robot.name} robot={robot} />
        ))}
        {unreachableRobots.map(robot => (
          <UnreachableRobotItem key={robot.name} {...robot} />
        ))}
      </RobotList>
    </SidePanel>
  )
}

const robotOrder = [['connected', 'local', 'name'], ['desc', 'desc', 'asc']]
const reachableOrder = [['local', 'name'], ['desc', 'asc']]
const unreachableOrder = [['name'], ['asc']]

function mapStateToProps(state: State): SP {
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

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    onScanClick: () => dispatch(startDiscovery()),
  }
}
