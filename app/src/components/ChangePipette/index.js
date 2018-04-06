// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Route} from 'react-router'
import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'

import TitledModal from './TitledModal'
// import ClearDeckAlertModal from './ClearDeckAlertModal'
import AttachPipetteTitle from './AttachPipetteTitle'
import PipetteSelection, {type PipetteSelectionProps} from './PipetteSelection'

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
  {value: 'p10_single', name: 'Single-Channel P10'},
  {value: 'p50_single', name: 'Single-Channel P50'},
  {value: 'p300_single', name: 'Single-Channel P300'},
  {value: 'p1000_single', name: 'Single-Channel P1000'},
  {value: 'p10_multi', name: '8-Channel P10'},
  {value: 'p50_multi', name: '8-Channel P50'},
  {value: 'p300_multi', name: '8-Channel P300'}
]

export default connect(mapStateToProps, mapDispatchToProps)(ChangePipette)

function ChangePipette (props: OP & SP & DP) {
  const {mount, /* moveToFront, moveToFrontRequest, */ onPipetteSelect} = props

  // if (!moveToFrontRequest.inProgress && !moveToFrontRequest.response) {
  //   return (<ClearDeckAlertModal {...props} onContinueClick={moveToFront} />)
  // }

  return (
    <Route path={`${props.baseUrl}/:model?`} render={(routeProps) => {
      const {match: {params: {model}}} = routeProps
      // TODO(mc, 2018-04-05): pull from external library
      const pipette = PIPETTES.find((p) => p.value === model)
      const onBackClick = pipette
        ? props.back
        : props.close

      return (
        <TitledModal
          title={TITLE}
          subtitle={`${mount} carriage`}
          onBackClick={onBackClick}
        >
          <AttachPipetteTitle name={pipette && pipette.name} />
          {!pipette && (
            <PipetteSelection options={PIPETTES} onChange={onPipetteSelect} />
          )}
        </TitledModal>
      )
    }} />
  )
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
      console.log(baseUrl)
      dispatch(push(changeUrl))
    }
  }
}
