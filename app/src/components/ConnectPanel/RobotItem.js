// @flow
// item in a RobotList
import {connect} from 'react-redux'
import {withRouter, type ContextRouter} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import {actions as robotActions} from '../../robot'
import {makeGetRobotUpdateInfo} from '../../http-api-client'
import {RobotListItem} from './RobotListItem.js'

type OP = {|
  ...$Exact<ViewableRobot>,
  ...ContextRouter,
|}

type SP = {|
  upgradable: boolean,
  selected: boolean,
|}

type DP = {|
  connect: () => mixed,
  disconnect: () => mixed,
|}

export type RobotItemProps = {
  ...OP,
  ...SP,
  ...DP,
}

export default withRouter(
  connect(
    makeMapStateToProps,
    mapDispatchToProps
  )(RobotListItem)
)

function makeMapStateToProps () {
  const getUpdateInfo = makeGetRobotUpdateInfo()

  return (state: State, ownProps: OP): SP => ({
    upgradable: getUpdateInfo(state, ownProps).type === 'upgrade',
    selected: ownProps.match.params.name === ownProps.name,
  })
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    connect: () => dispatch(robotActions.connect(ownProps.name)),
    disconnect: () => dispatch(robotActions.disconnect()),
  }
}
