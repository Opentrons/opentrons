// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Switch, Route, Redirect, withRouter} from 'react-router'
import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'
import {moveToChangePipette, fetchPipettes, makeGetRobotMove, makeGetRobotPipettes} from '../../http-api-client'
import type {RobotMoveState, PipettesResponse} from '../../http-api-client'
import TitledModal from './TitledModal'
import ClearDeckAlertModal from './ClearDeckAlertModal'
import ExitAlertModal from './ExitAlertModal'
import AttachPipetteTitle from './AttachPipetteTitle'
import PipetteSelection, {type PipetteSelectionProps} from './PipetteSelection'
import AttachPipetteInstructions from './AttachPipetteInstructions'
import CheckPipettesButton from './CheckPipettesButton'
import ConfirmPipette from './ConfirmPipette'
import RequestInProgressModal from './RequestInProgressModal'

type OP = {
  robot: Robot,
  mount: Mount,
  closeUrl: string,
  baseUrl: string,
}

type SP = {
  moveRequest: RobotMoveState,
  pipettes: ?PipettesResponse
}

type DP = {
  close: () => mixed,
  back: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onChange'>,
  moveToFront: () => mixed,
  confirmPipette: (string) => () => mixed,
}

const TITLE = 'Pipette Setup'

// TODO(mc, 2018-04-05): pull from external pipettes library
const PIPETTES = [
  {value: 'p10_single', name: 'Single-Channel P10', channels: '1'},
  {value: 'p50_single', name: 'Single-Channel P50', channels: '1'},
  {value: 'p300_single', name: 'Single-Channel P300', channels: '1'},
  {value: 'p1000_single', name: 'Single-Channel P1000', channels: '1'},
  {value: 'p10_multi', name: '8-Channel P10', channels: '8'},
  {value: 'p50_multi', name: '8-Channel P50', channels: '8'},
  {value: 'p300_multi', name: '8-Channel P300', channels: '8'}
]

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ChangePipette)
)

function ChangePipette (props: OP & SP & DP) {
  const {mount, baseUrl, closeUrl, onPipetteSelect, moveRequest, moveToFront, confirmPipette, pipettes: attachedPipettes} = props
  const subtitle = `${mount} carriage`
  const progressMessage = mount === 'right'
    ? 'Right pipette carriage moving to front and left.'
    : 'Left pipette carriage moving to front and right.'

  console.log(baseUrl)

  if (!moveRequest.inProgress && !moveRequest.response) {
    return (<ClearDeckAlertModal {...props} onContinueClick={moveToFront} />)
  }

  if (moveRequest.inProgress) {
    return (
      <RequestInProgressModal
        title={TITLE}
        subtitle={subtitle}
        onBackClick={props.close}
        mount={mount}
        message={progressMessage}
      />)
  }

  return (
    <Switch>
      <Route exact path={baseUrl} render={() => (
        <TitledModal
          title={TITLE}
          subtitle={subtitle}
          onBackClick={props.close}
        >
          <AttachPipetteTitle />
          <PipetteSelection
            options={PIPETTES}
            onChange={onPipetteSelect}
          />
        </TitledModal>
      )} />
      <Route path={`${baseUrl}/:model`} render={(routeProps) => {
        const {match: {url: urlWithModel, params: {model}}} = routeProps
        const pipette = PIPETTES.find((p) => p.value === model)
        const confirmUrl = `${urlWithModel}/confirm`
        const exitUrl = `${urlWithModel}/exit`
        const onBackClick = props.back
        const confirm = confirmPipette(confirmUrl)

        // guard against bad model strings
        if (!pipette) return (<Redirect to={baseUrl} />)

        return (
          <Switch>
            <Route path={exitUrl} render={() => (
              <ExitAlertModal cancelUrl={confirmUrl} continueUrl={closeUrl} />
            )} />
            <Route path={confirmUrl} render={() => (
              <ConfirmPipette
                title={TITLE}
                subtitle={subtitle}
                onBackClick={onBackClick}
                success={attachedPipettes && attachedPipettes[mount].model === model}
                direction='attach'
                mount={mount}
                exit={props.close}
                exitUrl={exitUrl}
                confirm={confirm}
                {...pipette}
              />
            )} />
            <Route render={() => (
              <TitledModal
                title={TITLE}
                subtitle={subtitle}
                onBackClick={onBackClick}
              >
                <AttachPipetteTitle name={pipette.name} />
                <AttachPipetteInstructions
                  mount={mount}
                  channels={pipette.channels}
                />
                <CheckPipettesButton onClick={confirm} />
              </TitledModal>
            )} />
          </Switch>
        )
      }} />
    </Switch>
  )
}

function makeMapStateToProps () {
  const getRobotMove = makeGetRobotMove()
  const getRobotPipettes = makeGetRobotPipettes()

  return (state: State, ownProps: OP): SP => {
    return {
      moveRequest: getRobotMove(state, ownProps.robot),
      pipettes: getRobotPipettes(state, ownProps.robot).response
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {closeUrl, baseUrl, robot, mount} = ownProps
  return {
    close: () => dispatch(push(closeUrl)),
    back: () => dispatch(push(baseUrl)),
    onPipetteSelect: (event: SyntheticInputEvent<>) => {
      dispatch(push(`${baseUrl}/${event.target.value}`))
    },
    moveToFront: () => {
      console.log('move to front')
      dispatch(moveToChangePipette(robot, mount))
    },
    confirmPipette: (confirmUrl) => () => {
      dispatch(fetchPipettes(robot))
        .then(() => dispatch(push(confirmUrl)))
    }
  }
}
