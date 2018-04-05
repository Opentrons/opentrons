// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Route} from 'react-router'
import type {State, Dispatch} from '../../types'
import type {Robot, Mount} from '../../robot'

import {TitleBar, DropdownField} from '@opentrons/components'
import TitledModal from './TitledModal'
import ClearDeckAlertModal from './ClearDeckAlertModal'

type OP = {
  robot: Robot,
  mount: Mount,
  backUrl: string,
  baseUrl: string,
}

type SP = {
  // TODO(mc, 2018-04-04): drive with API client
  moveToFrontRequest: {inProgress: boolean, response: ?{}, error: ?{}}
}

type DP = {
  onBackClick: () => mixed,
  onPipetteSelect: () => mixed,
  moveToFront: () => mixed,
}

const TITLE = 'Pipette Setup'

// TODO(mc, 2018-04-05): pull from external library
const PIPETTES = [
  {name: 'p10_single', value: 'Single-channel P10'},
  {name: 'p50_single', value: 'Single-channel P50'},
  {name: 'p300_single', value: 'Single-channel P300'},
  {name: 'p1000_single', value: 'Single-channel P1000'},
  {name: 'p10_multi', value: 'Multi-channel P10'},
  {name: 'p50_multi', value: 'Multi-channel P50'},
  {name: 'p300_multi', value: 'Multi-channel P300'}
]

export default connect(mapStateToProps, mapDispatchToProps)(ChangePipette)

function ChangePipette (props: OP & SP & DP) {
  const {mount, moveToFront, moveToFrontRequest, onPipetteSelect, onBackClick} = props

  // if (!moveToFrontRequest.inProgress && !moveToFrontRequest.response) {
  //   return (<ClearDeckAlertModal {...props} onContinueClick={moveToFront} />)
  // }

  return (
    <Route path={`${props.baseUrl}/:model`} children={(routeProps) => {
      const selectedPipette = routeProps.match && routeProps.match.params.model

      return (
        <TitledModal
          title={TITLE}
          subtitle={`${mount} carriage`}
          onBackClick={onBackClick}
        >
          <h2>Attach {selectedPipette || ''} Pipette</h2>
          <label></label>
          <DropdownField
            options={PIPETTES}
            onChange={onPipetteSelect}
          />
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
  const {backUrl, baseUrl} = ownProps
  const changeUrl = `${baseUrl}/attach`
  return {
    onBackClick: () => dispatch(push(backUrl)),
    onPipetteSelect: (event: SyntheticInputEvent<*>) => {
      dispatch(push(`${baseUrl}/${event.target.value}`))
    },
    // TODO(mc, 2018-04-04): implement
    moveToFront: () => {
      console.log('MOVE TO FRONT NOT IMPLEMENTED')
      dispatch(push(changeUrl))
    }
  }
}
