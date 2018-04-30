// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push, goBack} from 'react-router-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'
import {getPipette, getPipetteModels} from '@opentrons/labware-definitions'

import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'
import type {Direction, ChangePipetteProps} from './types'

import type {RobotHome, RobotMoveState} from '../../http-api-client'

import {
  home,
  moveToChangePipette,
  fetchPipettes,
  disengagePipetteMotors,
  makeGetRobotMove,
  makeGetRobotHome,
  makeGetRobotPipettes
} from '../../http-api-client'

import ClearDeckAlertModal from '../ClearDeckAlertModal'
import ExitAlertModal from './ExitAlertModal'
import type {PipetteSelectionProps} from './PipetteSelection'
import Instructions from './Instructions'
import ConfirmPipette from './ConfirmPipette'
import RequestInProgressModal from './RequestInProgressModal'

type Props = {
  match: Match,
  robot: Robot,
  parentUrl: string,
}

const TITLE = 'Pipette Setup'
// used to guarentee mount param in route is left or right
const RE_MOUNT = '(left|right)'
// used to guarentee model param in route is a pipettes model
const RE_MODEL = `(${getPipetteModels().join('|')})`

const ConnectedChangePipetteRouter = withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ChangePipetteRouter)
)

export default function ChangePipette (props: Props) {
  const {robot, parentUrl, match: {path}} = props

  return (
    <Route
      path={`${path}/:mount${RE_MOUNT}/:model${RE_MODEL}?`}
      render={(propsWithMount) => {
        const {match: {params, url: baseUrl}} = propsWithMount
        const mount: Mount = (params.mount: any)
        const wantedPipette = params.model ? getPipette(params.model) : null

        return (
          <ConnectedChangePipetteRouter
            robot={robot}
            title={TITLE}
            subtitle={`${mount} carriage`}
            mount={mount}
            wantedPipette={wantedPipette}
            parentUrl={parentUrl}
            baseUrl={baseUrl}
            confirmUrl={`${baseUrl}/confirm`}
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
  mount: Mount,
  robot: Robot,
  wantedPipette: ?PipetteConfig,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  parentUrl: string,
}

type SP = {
  moveRequest: RobotMoveState,
  homeRequest: RobotHome,
  actualPipette: ?PipetteConfig,
  displayName: string,
  direction: Direction,
  success: boolean,
  attachedWrong: boolean,
}

type DP = {
  exit: () => mixed,
  back: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onChange'>,
  moveToFront: () => mixed,
  checkPipette: () => mixed,
  confirmPipette: () => mixed,
}

function ChangePipetteRouter (props: ChangePipetteProps) {
  const {baseUrl, confirmUrl, exitUrl, moveRequest, homeRequest} = props
  const clearDeckProps = {
    cancelText: 'cancel',
    continueText: 'move pipette to front',
    parentUrl: props.parentUrl,
    onContinueClick: props.moveToFront
  }
  if (!moveRequest.inProgress && !moveRequest.response) {
    return (
      <ClearDeckAlertModal {...clearDeckProps} >
      {props.actualPipette && (
        <p>
          Detaching a pipette will also clear its related calibration data
        </p>
      )}
      </ClearDeckAlertModal>
    )
  }

  if (moveRequest.inProgress || homeRequest.inProgress) {
    return (<RequestInProgressModal {...props} />)
  }

  return (
    <Switch>
      <Route exact path={baseUrl} render={() => (
        <Instructions {...props} />
      )} />
      <Route path={exitUrl} render={() => (
        <ExitAlertModal {...props} />
      )} />
      <Route path={confirmUrl} render={() => (
        <ConfirmPipette {...props} />
      )} />
    </Switch>
  )
}

function makeMapStateToProps () {
  const getRobotMove = makeGetRobotMove()
  const getRobotHome = makeGetRobotHome()
  const getRobotPipettes = makeGetRobotPipettes()

  return (state: State, ownProps: OP): SP => {
    const {mount, wantedPipette} = ownProps
    const pipettes = getRobotPipettes(state, ownProps.robot).response
    const model = pipettes && pipettes[mount] && pipettes[mount].model
    const actualPipette = model ? getPipette(model) : null
    const direction = actualPipette ? 'detach' : 'attach'

    const success = (
      (wantedPipette && wantedPipette.model) ===
      (actualPipette && actualPipette.model)
    )

    const attachedWrong = !!(
      !success &&
      wantedPipette &&
      actualPipette
    )

    const displayName = (
      (actualPipette && actualPipette.displayName) ||
      (wantedPipette && wantedPipette.displayName) ||
      ''
    )

    return {
      actualPipette,
      direction,
      success,
      attachedWrong,
      displayName,
      moveRequest: getRobotMove(state, ownProps.robot),
      homeRequest: getRobotHome(state, ownProps.robot)
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {confirmUrl, parentUrl, baseUrl, robot, mount} = ownProps
  const disengage = () => dispatch(disengagePipetteMotors(robot, mount))
  const checkPipette = () => disengage()
    .then(() => dispatch(fetchPipettes(robot)))

  return {
    checkPipette,
    exit: () => dispatch(home(robot, mount))
      .then(() => dispatch(push(parentUrl))),
    back: () => dispatch(goBack()),
    onPipetteSelect: (evt) => dispatch(push(`${baseUrl}/${evt.target.value}`)),
    moveToFront: () => dispatch(moveToChangePipette(robot, mount))
      .then(disengage),
    confirmPipette: () => checkPipette().then(() => dispatch(push(confirmUrl)))
  }
}
