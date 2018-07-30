// @flow
// attached pipettes container card
import * as React from 'react'
import {connect} from 'react-redux'

import type {State} from '../../types'
import type {Robot} from '../../robot'
import type {Pipette} from '../../http-api-client'
import {makeGetRobotPipettes, fetchPipettes, clearMoveResponse} from '../../http-api-client'

import InstrumentInfo from './InstrumentInfo'
import {IntervalWrapper, Card} from '@opentrons/components'

type OP = Robot

type SP = {
  inProgress: boolean,
  left: ?Pipette,
  right: ?Pipette,
}

type DP = {
  fetchPipettes: () => mixed,
  clearMove: () => mixed,
}

type Props = OP & SP & DP

const TITLE = 'Pipettes'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(AttachedPipettesCard)

function AttachedPipettesCard (props: Props) {
  return (
    <IntervalWrapper
      refresh={props.fetchPipettes}
      interval={1000}
    >
      <Card
        title={TITLE}
      >
        <InstrumentInfo mount='left' name={props.name} {...props.left} onClick={props.clearMove} />
        <InstrumentInfo mount='right' name={props.name} {...props.right} onClick={props.clearMove} />
      </Card>
    </IntervalWrapper>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()

  return (state, ownProps) => {
    const {inProgress, response} = getRobotPipettes(state, ownProps)
    const {left, right} = response || {left: null, right: null}

    return {inProgress, left, right}
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchPipettes: () => dispatch(fetchPipettes(ownProps)),
    clearMove: () => dispatch(clearMoveResponse(ownProps))
  }
}
