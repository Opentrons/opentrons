// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {selectors as robotSelectors} from '../../robot'
import {startDiscovery, getScanning} from '../../discovery'

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
  onScanClick: () => mixed,
}

type Props = StateProps & DispatchProps

export default connect(mapStateToProps, mapDispatchToProps)(ConnectPanel)

function ConnectPanel (props: Props) {
  return (
    <SidePanel title='Robots'>
      <ScanStatus {...props} />
      <RobotList>
        {props.robots.map((robot) => (
          <RobotItem key={robot.name} {...robot} />
        ))}
      </RobotList>
    </SidePanel>
  )
}

function mapStateToProps (state: State): StateProps {
  const robots = robotSelectors.getDiscovered(state)

  return {
    robots,
    found: robots.length > 0,
    isScanning: getScanning(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch): DispatchProps {
  return {
    onScanClick: () => dispatch(startDiscovery()),
  }
}
