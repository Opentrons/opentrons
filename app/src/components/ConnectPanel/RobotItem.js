// @flow
// item in a RobotList
import { connect } from 'react-redux'
import { withRouter, type Match } from 'react-router'

import type { State, Dispatch } from '../../types'
import type { Robot } from '../../robot'
import { actions as robotActions } from '../../robot'
import { makeGetRobotUpdateInfo } from '../../http-api-client'

import { RobotListItem } from './RobotListItem.js'

type OP = Robot & {
  match: Match,
}

type SP = {
  upgradable: boolean,
  selected: boolean,
}

type DP = {
  connect: () => mixed,
  disconnect: () => mixed,
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
