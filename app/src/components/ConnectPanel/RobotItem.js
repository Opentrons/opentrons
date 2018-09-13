// @flow
// item in a RobotList
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import {actions as robotActions} from '../../robot'
import {makeGetAvailableRobotUpdate} from '../../http-api-client'

import {RobotListItem} from './RobotList.js'

type OP = Robot

type SP = {
  availableUpdate: ?string,
}

type DP = {
  connect: () => mixed,
  disconnect: () => mixed,
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(RobotListItem)
)

function makeMapStateToProps () {
  const getAvailableRobotUpdate = makeGetAvailableRobotUpdate()

  return (state: State, ownProps: OP): SP => ({
    availableUpdate: getAvailableRobotUpdate(state, ownProps),
  })
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    connect: () => dispatch(robotActions.connect(ownProps.name)),
    disconnect: () => dispatch(robotActions.disconnect()),
  }
}
