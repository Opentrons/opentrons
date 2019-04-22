// @flow
// item in a RobotList
import { connect } from 'react-redux'
import { withRouter, type ContextRouter } from 'react-router'

import { actions as robotActions } from '../../robot'
import { makeGetRobotUpdateInfo } from '../../http-api-client'
import { RobotListItem } from './RobotListItem.js'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery'

type WithRouterOP = {| robot: ViewableRobot |}

type OP = {| ...ContextRouter, ...WithRouterOP |}

type SP = {| upgradable: boolean, selected: boolean |}

type DP = {| connect: () => mixed, disconnect: () => mixed |}

export type RobotItemProps = { ...OP, ...SP, ...DP }

export default withRouter<WithRouterOP>(
  connect<RobotItemProps, OP, SP, DP, State, Dispatch>(
    makeMapStateToProps,
    mapDispatchToProps
  )(RobotListItem)
)

function makeMapStateToProps(): (State, OP) => SP {
  const getUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => ({
    upgradable: getUpdateInfo(state, ownProps.robot).type === 'upgrade',
    selected: ownProps.match.params.name === ownProps.robot.name,
  })
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    connect: () => dispatch(robotActions.connect(ownProps.robot.name)),
    disconnect: () => dispatch(robotActions.disconnect()),
  }
}
