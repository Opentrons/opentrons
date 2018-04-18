// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push, goBack} from 'react-router-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'

import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'
import type {Pipette, ChangePipetteProps} from './types'

import type {
  RobotHome,
  RobotMoveState,
  PipettesResponse
} from '../../http-api-client'

import {
  home,
  moveToChangePipette,
  fetchPipettes,
  makeGetRobotMove,
  makeGetRobotHome,
  makeGetRobotPipettes
} from '../../http-api-client'

import PIPETTES from './pipettes'
import ClearDeckAlertModal from './ClearDeckAlertModal'
import ExitAlertModal from './ExitAlertModal'
import type {PipetteSelectionProps} from './PipetteSelection'
import AttachPipette from './AttachPipette'
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
const RE_MODEL = `(${PIPETTES.map(p => p.model).join('|')})`

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
        const pipette = PIPETTES.find(p => p.model === params.model)

        return (
          <ConnectedChangePipetteRouter
            robot={robot}
            title={TITLE}
            subtitle={`${mount} carriage`}
            mount={mount}
            pipette={pipette}
            direction='attach'
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
  subtitle: string,
  mount: Mount,
  robot: Robot,
  pipette: ?Pipette,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  parentUrl: string,
}

type SP = {
  moveRequest: RobotMoveState,
  homeRequest: RobotHome,
  pipettes: ?PipettesResponse
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

  if (!moveRequest.inProgress && !moveRequest.response) {
    return (<ClearDeckAlertModal {...props} />)
  }

  if (moveRequest.inProgress || homeRequest.inProgress) {
    return (<RequestInProgressModal {...props} />)
  }

  return (
    <Switch>
      <Route exact path={baseUrl} render={() => (
        <AttachPipette {...props} />
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
    return {
      moveRequest: getRobotMove(state, ownProps.robot),
      homeRequest: getRobotHome(state, ownProps.robot),
      pipettes: getRobotPipettes(state, ownProps.robot).response
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {confirmUrl, parentUrl, baseUrl, robot, mount} = ownProps

  return {
    exit: () => dispatch(home(robot, mount))
      .then(() => dispatch(push(parentUrl))),
    back: () => dispatch(goBack()),
    onPipetteSelect: (event) => {
      dispatch(push(`${baseUrl}/${event.target.value}`))
    },
    moveToFront: () => dispatch(moveToChangePipette(robot, mount)),
    checkPipette: () => dispatch(fetchPipettes(robot)),
    confirmPipette: () => dispatch(fetchPipettes(robot))
      .then(() => dispatch(push(confirmUrl)))
  }
}
