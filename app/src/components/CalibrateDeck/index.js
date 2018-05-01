// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {CalibrateDeckProps} from './types'

import {
  makeGetRobotMove
} from '../../http-api-client'

import type {RobotMoveState} from '../../http-api-client'

import ClearDeckAlertModal from '../ClearDeckAlertModal'
import RequestInProgressModal from './RequestInProgressModal'
import AttachTipModal from './AttachTipModal'

type Props = {
  match: Match,
  robot: Robot,
  parentUrl: string,
}

const TITLE = 'Deck Calibration'

const ConnectedCalibrateDeckRouter = withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(CalibrateDeckRouter)
)

export default function CalibrateDeck (props: Props) {
  const {robot, parentUrl, match: {path}} = props
  return (
    <Route
      path={`${path}/:step?`}
      render={(propsWithStep) => {
        const {match: {params}} = propsWithStep
        const step: string = (params.step: any)
        const NUM_STEP = step.replace(/^\D+/g, '')
        const subtitle = `Step ${NUM_STEP} of 6`
        const baseUrl = path
        return (
          <ConnectedCalibrateDeckRouter
            robot={robot}
            title={TITLE}
            subtitle={subtitle}
            parentUrl={parentUrl}
            baseUrl={baseUrl}
            exitUrl={`${baseUrl}/exit`}
          />
        )
      }}
    />
  )
}

type OP = {
  title: string,
  subtitle: string,
  robot: Robot,
  parentUrl: string,
  baseUrl: string,
  exitUrl: string,
}

type SP = {
  moveRequest: RobotMoveState
}

type DP = {
  back: () => mixed,
}

function CalibrateDeckRouter (props: CalibrateDeckProps) {
  const {moveRequest, baseUrl} = props
  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl
  }
  if (!moveRequest.inProgress && !moveRequest.response) {
    return (
      <ClearDeckAlertModal {...clearDeckProps} />
    )
  }
  if (moveRequest.inProgress) {
    return (<RequestInProgressModal {...props} />)
  }
  return (
    <Switch>
      <Route path={`${baseUrl}/step-1`} render={() => (
        <AttachTipModal {...props}/>
      )} />
    </Switch>
  )
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    back: () => dispatch(goBack())
  }
}

function makeMapStateToProps (state: State, ownProps: OP): SP {
  const getRobotMove = makeGetRobotMove()
  return {
    moveRequest: getRobotMove(state, ownProps.robot)
  }
}
