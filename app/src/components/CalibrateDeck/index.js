// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push, goBack} from 'react-router-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {OP, SP, DP, CalibrateDeckProps, CalibrationStep} from './types'

import {getPipette} from '@opentrons/labware-definitions'

import {
  home,
  startDeckCalibration,
  deckCalibrationCommand,
  setCalibrationJogStep,
  getCalibrationJogStep,
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
import ExitAlertModal from './ExitAlertModal'

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
        const {match: {url, params}} = propsWithStep
        const step: CalibrationStep = (params.step: any)
        const subtitle = `Step ${step} of 6`
        // const calibrationStep = `step-${step}`
        // const baseUrl = url
        return (
          <ConnectedCalibrateDeckRouter
            robot={robot}
            title={TITLE}
            subtitle={subtitle}
            parentUrl={parentUrl}
            baseUrl={path}
            exitUrl={`${url}/exit`}
            calibrationStep={step}
          />
        )
      }}
    />
  )
}

function CalibrateDeckRouter (props: CalibrateDeckProps) {
  const {startRequest, moveRequest, baseUrl, parentUrl, calibrationStep} = props
  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl,
    onCancelClick: props.onCancelClick
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

    // props are generic in case we decide to reuse
    return (<ErrorModal closeUrl={parentUrl} error={startRequest.error} />)
  }

  if (!moveRequest.inProgress && !moveRequest.response) {
    return (<ClearDeckAlertModal {...clearDeckProps} />)
  }

  if (moveRequest.inProgress) {
    return (<RequestInProgressModal {...props} />)
  }

  return (
    <Switch>
      <Route path={`${baseUrl}/step-${calibrationStep}/exit`} render={() => (
        <ExitAlertModal {...props} />
      )} />
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
    const startRequest = getDeckCalStartState(state, ownProps.robot)
    const pipette = startRequest.response
      ? getPipette(startRequest.response.pipette.model)
      : null

    return {
      pipette,
      startRequest,
      moveRequest: getRobotMove(state, ownProps.robot),
      step: getCalibrationJogStep(state)
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot, parentUrl} = ownProps

  return {
    jog: (axis, direction, step) => dispatch(
      deckCalibrationCommand(robot, {command: 'jog', axis, direction, step})
    ),
    onStepSelect: (event) => {
      const step = Number(event.target.value)
      dispatch(setCalibrationJogStep(step))
    },
    forceStart: () => dispatch(startDeckCalibration(robot, true)),
    // cancel button click in clear deck alert modal
    onCancelClick: () => dispatch(deckCalibrationCommand(robot, {command: 'release'})),
    // exit button click in title bar, opens exit alert modal, confirm exit click
    exit: () => dispatch(home(robot))
      .then(() => dispatch(deckCalibrationCommand(robot, {command: 'release'})))
      .then(() => dispatch(push(parentUrl))),
    // cancel button click in exit alert modal
    back: () => dispatch(goBack())
  }
}
