// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'

import ClearDeckAlertModal from './ClearDeckAlertModal'

type OP = {
  robot: Robot,
  mount: Mount,
  backUrl: string,
}

type SP = {
  // TODO(mc, 2018-04-04): drive with API client
  moveToFrontRequest: {inProgress: boolean, response: ?{}, error: ?{}}
}

type DP = {
  moveToFront: () => mixed
}

export default connect(mapStateToProps, mapDispatchToProps)(ChangePipette)

function ChangePipette (props: OP & SP & DP) {
  const {moveToFrontRequest} = props

  if (!moveToFrontRequest.inProgress && !moveToFrontRequest.response) {
    return (<ClearDeckAlertModal {...props} />)
  }

  return (
    'hello world'
  )
}

function mapStateToProps (state: State, ownProps: OP): SP {
  return {
    // TODO(mc, 2018-04-04): implement
    moveToFrontRequest: {
      inProgress: false,
      response: null,
      error: null
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    // TODO(mc, 2018-04-04): implement
    moveToFront: () => console.log('MOVE TO FRONT NOT IMPLEMENTED')
  }
}
