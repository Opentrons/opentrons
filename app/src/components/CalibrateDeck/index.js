// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {OP, SP, DP, CalibrateDeckProps} from './types'

import {getPipette} from '@opentrons/labware-definitions'

import {
  startDeckCalibration,
  makeGetRobotMove,
  makeGetDeckCalibrationStartState
} from '../../http-api-client'

import ClearDeckAlertModal from '../ClearDeckAlertModal'
import RequestInProgressModal from './RequestInProgressModal'
import AttachTipModal from './AttachTipModal'
import InUseModal from './InUseModal'
import NoPipetteModal from './NoPipetteModal'
import ErrorModal from './ErrorModal'

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

function CalibrateDeckRouter (props: CalibrateDeckProps) {
  const {startRequest, moveRequest, baseUrl, parentUrl} = props
  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl
  }

  if (startRequest.error) {
    const {status} = startRequest.error

    // conflict: token already issued
    if (status === 409) {
      return (<InUseModal {...props} />)
    }

    // forbidden: no pipette attached
    if (status === 403) {
      return (<NoPipetteModal {...props}/>)
    }
    // TODO: (ka 2018-5-2) kept props generic in case we decide to reuse
    return (<ErrorModal closeUrl={parentUrl} error={startRequest.error}/>)
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

function makeMapStateToProps () {
  const getRobotMove = makeGetRobotMove()
  const getDeckCalStartState = makeGetDeckCalibrationStartState()

  return (state: State, ownProps: OP): SP => {
    const moveRequest = getRobotMove(state, ownProps.robot)
    const startRequest = getDeckCalStartState(state, ownProps.robot)
    const pipette = startRequest.response
      ? getPipette(startRequest.response.pipette.model)
      : null

    return {moveRequest, startRequest, pipette}
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    back: () => dispatch(goBack()),
    forceStart: () => dispatch(startDeckCalibration(ownProps.robot, true))
  }
}
