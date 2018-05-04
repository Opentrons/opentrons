// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {OP, SP, DP, CalibrateDeckProps, CalibrationStep} from './types'

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
import InstructionsModal from './InstructionsModal'

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
      path={`${path}/step-:step`}
      render={(propsWithStep) => {
        const {match: {params}} = propsWithStep
        const step: CalibrationStep = (params.step: any)
        const subtitle = `Step ${step} of 6`
        // const calibrationStep = `step-${step}`
        const baseUrl = path

        return (
          <ConnectedCalibrateDeckRouter
            robot={robot}
            title={TITLE}
            subtitle={subtitle}
            parentUrl={parentUrl}
            baseUrl={baseUrl}
            exitUrl={`${baseUrl}/exit`}
            calibrationStep={step}
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
      <Route path={`${baseUrl}/step-2`} render={() => (
        <InstructionsModal {...props} />
      )} />
      <Route path={`${baseUrl}/step-3`} render={() => (
        <InstructionsModal {...props} />
      )} />
      <Route path={`${baseUrl}/step-4`} render={() => (
        <InstructionsModal {...props} />
      )} />
      <Route path={`${baseUrl}/step-5`} render={() => (
        <InstructionsModal {...props} />
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
    // TODO (ka 2018-5-4): Swap for DeckCalibrationState reducer in JogControls PR
    // increment selet will not update UI at this time, will console.log clicked increment
    const currentJogDistance = 0.1
    return {moveRequest, startRequest, pipette, currentJogDistance}
  }
}

// TODO (ka 2018-5-4): Wire up HTTP jog actions in JogControls PR
function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const makeJog = (axis, direction) => () => {
    console.log(axis, direction)
  }
  return {
    makeJog,
    onIncrementSelect: (event) => {
      const step = Number(event.target.value)
      console.log(step)
    },
    forceStart: () => dispatch(startDeckCalibration(ownProps.robot, true))
  }
}
