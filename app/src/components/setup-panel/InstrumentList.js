// @flow
import React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import {TitledList} from '@opentrons/components'
import InstrumentListItem from './InstrumentListItem'

export default connect(mapStateToProps, mapDispatchToProps)(InstrumentList)

function InstrumentList (props) {
  const title = 'Pipette Setup'

  return (
    <TitledList title={title}>
      {props.instruments.map((inst) => (
        <InstrumentListItem key={inst.mount} {...props} {...inst} />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state) {
  return {
    instruments: robotSelectors.getInstruments(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>) {
  return {
    clearDeckPopulated: () => dispatch(robotActions.setDeckPopulated(false))
  }
}
