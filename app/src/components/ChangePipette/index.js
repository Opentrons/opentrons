// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Switch, Route, Redirect} from 'react-router'
import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'

import TitledModal from './TitledModal'
// import ClearDeckAlertModal from './ClearDeckAlertModal'
import ExitAlertModal from './ExitAlertModal'
import AttachPipetteTitle from './AttachPipetteTitle'
import PipetteSelection, {type PipetteSelectionProps} from './PipetteSelection'
import AttachPipetteInstructions from './AttachPipetteInstructions'
import CheckPipettesButton from './CheckPipettesButton'
import ConfirmPipette from './ConfirmPipette'

type OP = {
  robot: Robot,
  mount: Mount,
  closeUrl: string,
  baseUrl: string,
}

type SP = {
  // TODO(mc, 2018-04-04): drive with API client
  moveToFrontRequest: {inProgress: boolean, response: ?{}, error: ?{}}
}

type DP = {
  close: () => mixed,
  back: () => mixed,
  onPipetteSelect: $PropertyType<PipetteSelectionProps, 'onChange'>,
  moveToFront: () => mixed,
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

export default connect(mapStateToProps, mapDispatchToProps)(ChangePipette)

function ChangePipette (props: OP & SP & DP) {
  const {mount, baseUrl, closeUrl, onPipetteSelect} = props
  const subtitle = `${mount} carriage`

  // if (!moveToFrontRequest.inProgress && !moveToFrontRequest.response) {
  //   return (<ClearDeckAlertModal {...props} onContinueClick={moveToFront} />)
  // }

  return (
    <Switch>
      <Route exact path={baseUrl} component={SelectPipette} />
      <Route path={`${baseUrl}/:model`} render={(routeProps) => {
        const {match: {url: urlWithModel, params: {model}}} = routeProps
        const pipette = PIPETTES.find((p) => p.value === model)
        const confirmUrl = `${urlWithModel}/confirm`
        const exitUrl = `${urlWithModel}/exit`
        const onBackClick = props.back

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
                error={null}
                direction='attach'
                mount={mount}
                exit={props.close}
                exitUrl={exitUrl}
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
                <CheckPipettesButton url={confirmUrl} />
              </TitledModal>
            )} />
          </Switch>
        )
      }} />
    </Switch>
  )

  function SelectPipette () {
    return (
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
    )
  }
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
  const {closeUrl, baseUrl} = ownProps
  const changeUrl = `${baseUrl}/attach`

  return {
    close: () => dispatch(push(closeUrl)),
    back: () => dispatch(push(baseUrl)),
    onPipetteSelect: (event: SyntheticInputEvent<>) => {
      dispatch(push(`${baseUrl}/${event.target.value}`))
    },
    // TODO(mc, 2018-04-04): implement
    moveToFront: () => {
      console.log('MOVE TO FRONT NOT IMPLEMENTED')
      dispatch(push(changeUrl))
    }
  }
}
