// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push, goBack} from 'react-router-redux'
import {Switch, Route, withRouter} from 'react-router'

import type {State, Dispatch} from '../../types'
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
import InUseModal from './InUseModal'
import NoPipetteModal from './NoPipetteModal'
import ErrorModal from './ErrorModal'
import InstructionsModal from './InstructionsModal'
import ExitAlertModal from './ExitAlertModal'

const RE_STEP = '(1|2|3|4|5|6)'
const BAD_PIPETTE_ERROR = 'Unexpected pipette response from robot; please contact support'

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(CalibrateDeck)
)

function CalibrateDeck (props: CalibrateDeckProps) {
  const {startRequest, parentUrl, match: {path}} = props

  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl,
    onContinueClick: props.onContinueClick,
    onCancelClick: props.onCancelClick
  }

  return (
    <Switch>
      <Route path={path} exact render={() => {
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

        if (startRequest.response) {
          return (<ClearDeckAlertModal {...clearDeckProps} />)
        }

        return null
      }} />
      <Route path={`${path}/step-:step${RE_STEP}`} render={(stepProps) => {
        const {pipetteProps} = props
        const {match: {params, url: stepUrl}} = stepProps
        const step: CalibrationStep = (params.step: any)
        const exitUrl = `${stepUrl}/exit`

        if (!pipetteProps || !pipetteProps.pipette) {
          console.error('Cannot calibrate deck without a pipette or mount')

          return (
            <ErrorModal
              closeUrl={exitUrl}
              error={{name: 'BadData', message: BAD_PIPETTE_ERROR}}
            />)
        }

        const startedProps = {
          ...props,
          exitUrl,
          pipette: pipetteProps.pipette,
          mount: pipetteProps.mount,
          calibrationStep: step
        }

        return (
          <div>
            <InstructionsModal {...startedProps} />
            <Route path={exitUrl} render={() => (
              <ExitAlertModal {...props} />
            )} />
          </div>
        )
      }} />
    </Switch>
  )
}

function makeMapStateToProps () {
  const getRobotMove = makeGetRobotMove()
  const getDeckCalStartState = makeGetDeckCalibrationStartState()

  return (state: State, ownProps: OP): SP => {
    const {robot} = ownProps
    const startRequest = getDeckCalStartState(state, robot)
    const pipetteInfo = startRequest.response && startRequest.response.pipette
    const pipetteProps = pipetteInfo
      ? {mount: pipetteInfo.mount, pipette: getPipette(pipetteInfo.model)}
      : null

    return {
      startRequest,
      pipetteProps,
      moveRequest: getRobotMove(state, robot),
      step: getCalibrationJogStep(state)
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot, parentUrl, match: {url}} = ownProps

  return {
    jog: (axis, direction, step) => dispatch(
      deckCalibrationCommand(robot, {command: 'jog', axis, direction, step})
    ),
    onStepSelect: (event) => {
      const step = Number(event.target.value)
      dispatch(setCalibrationJogStep(step))
    },
    forceStart: () => dispatch(startDeckCalibration(robot, true)),
    // continue button click in clear modal
    onContinueClick: () => dispatch(push(`${url}/step-1`)),
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
