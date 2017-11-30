import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../../robot'

import RobotList from './RobotList'
import RobotItem from './RobotItem'
import ScanStatus from './ScanStatus'

export default connect(mapStateToProps, null, mergeProps)(ConnectPanel)

function ConnectPanel (props) {
  return (
    <div>
      <RobotList>
        {props.robots.map((robot) => (
          <RobotItem key={robot.name} {...robot} />
        ))}
      </RobotList>
      <ScanStatus {...props} />
    </div>
  )
}

function mapStateToProps (state) {
  const robots = robotSelectors.getDiscovered(state)

  return {
    robots,
    found: robots.length > 0,
    isScanning: robotSelectors.getIsScanning(state)
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {dispatch} = dispatchProps
  // TODO(mc, 2017-11-13): memoize with reselect
  const robots = stateProps.robots.map((robot) => ({
    ...robot,
    onConnectClick: () => dispatch(robotActions.connect(robot.host)),
    onDisconnectClick: () => dispatch(robotActions.disconnect())
  }))

  return {
    ...stateProps,
    robots,
    onScanClick: () => dispatch(robotActions.discover())
  }
}
