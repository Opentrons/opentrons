// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push, goBack} from 'react-router-redux'
import {Switch, Route, withRouter, type Match} from 'react-router'
import {getPipette, getPipetteNames} from '@opentrons/shared-data'

import type {PipetteConfig} from '@opentrons/shared-data'
import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'
import type {Direction, ChangePipetteProps} from './types'

import type {RobotHome, RobotMove} from '../../http-api-client'

import {
  home,
  moveRobotTo,
  fetchPipettes,
  disengagePipetteMotors,
  makeGetRobotMove,
  makeGetRobotHome,
  makeGetRobotPipettes,
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
const RE_NAME = `(${getPipetteNames().join('|')})`

const ConnectedChangePipetteRouter = withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ChangePipetteRouter)
)

export default function ChangePipette (props: Props) {
  const {robot, parentUrl, match: {path}} = props

  return (
    <Route
      path={`${path}/:mount${RE_MOUNT}/:name${RE_NAME}?`}
      render={(propsWithMount) => {
        const {match: {params, url: baseUrl}} = propsWithMount
        const mount: Mount = (params.mount: any)
        const wantedPipetteName = params.name || null

        return (
          <ConnectedChangePipetteRouter
            robot={robot}
            title={TITLE}
            subtitle={`${mount} mount`}
            mount={mount}
            wantedPipetteName={wantedPipetteName}
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
  wantedPipetteName: ?string,
  baseUrl: string,
  confirmUrl: string,
  exitUrl: string,
  parentUrl: string,
}

type SP = {
  moveRequest: RobotMove,
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
    onContinueClick: props.moveToFront,
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
    const {mount, wantedPipetteName} = ownProps
    const pipettes = getRobotPipettes(state, ownProps.robot).response
    const model = pipettes && pipettes[mount] && pipettes[mount].model
    const actualPipette = model ? getPipette(model) : null
    const direction = actualPipette ? 'detach' : 'attach'

    const success = (
      (actualPipette && actualPipette.displayName === wantedPipetteName) ||
      (!actualPipette && !wantedPipetteName)
    )

    const attachedWrong = !!(
      !success &&
      wantedPipetteName &&
      actualPipette
    )

    const displayName = (
      (actualPipette && actualPipette.displayName) ||
      (wantedPipetteName) ||
      ''
    )

    return {
      actualPipette,
      direction,
      success,
      attachedWrong,
      displayName,
      moveRequest: getRobotMove(state, ownProps.robot),
      homeRequest: getRobotHome(state, ownProps.robot),
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {confirmUrl, parentUrl, baseUrl, robot, mount} = ownProps
  const disengage = () => dispatch(disengagePipetteMotors(robot, mount))
  const checkPipette = () => disengage()
    .then(() => dispatch(fetchPipettes(robot, true)))

  return {
    checkPipette,
    exit: () => dispatch(home(robot, mount))
      .then(() => dispatch(push(parentUrl))),
    back: () => dispatch(goBack()),
    onPipetteSelect: (evt) => dispatch(push(`${baseUrl}/${evt.target.value}`)),
    moveToFront: () => dispatch(moveRobotTo(robot, {
      mount,
      position: 'change_pipette',
    })).then(disengage),
    confirmPipette: () => checkPipette().then(() => dispatch(push(confirmUrl))),
  }
}
