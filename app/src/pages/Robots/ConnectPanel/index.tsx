import * as React from 'react'
import { connect } from 'react-redux'
import orderBy from 'lodash/orderBy'

import {
  startDiscovery,
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../../redux/discovery'

import type { State, Dispatch } from '../../../redux/types'

import { SidePanel } from '@opentrons/components'
import { RobotList } from './RobotList'
import { RobotItem } from './RobotItem'
import { ScanStatus } from './ScanStatus'
import { UnreachableRobotItem } from './UnreachableRobotItem'

import type {
  Robot,
  ReachableRobot,
  UnreachableRobot,
} from '../../../redux/discovery/types'

interface SP {
  robots: Robot[]
  reachableRobots: ReachableRobot[]
  unreachableRobots: UnreachableRobot[]
  found: boolean
  isScanning: boolean
}

interface DP {
  onScanClick: () => unknown
}

type Props = SP & DP

function ConnectPanelComponent(props: Props): JSX.Element {
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

const robotOrder = [
  ['connected', 'local', 'name'],
  ['desc', 'desc', 'asc'],
]
const reachableOrder = [
  ['local', 'name'],
  ['desc', 'asc'],
]
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

// slight code change here moving from the functional to object version of mapDispatchToProps satisfies the connect
// functions types without having to import other types from react-redux. Mostly a convenience change as all new
// connected components use the hooks api

// const mapDispatchToProps: DP = {
//   onScanClick: () => startDiscovery(),
// }

export const ConnectPanel = connect(
  mapStateToProps,
  // @ts-expect-error TODO: use commented code above
  mapDispatchToProps
)(ConnectPanelComponent)
