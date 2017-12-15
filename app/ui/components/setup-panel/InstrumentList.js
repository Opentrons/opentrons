import React from 'react'
import {connect} from 'react-redux'
import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import TitledList from './TitledList'
import InstrumentListItem from './InstrumentListItem'

export default connect(mapStateToProps, null, mergeProps)(InstrumentList)

function InstrumentList (props) {
  const title = 'Pipette Setup'
  return (
    <TitledList title={title}>
      {props.instruments.map((instrument) => (
        <InstrumentListItem key={instrument.axis} {...props} {...instrument} />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state, ownProps) {
  return {
    currentInstrument: robotSelectors.getCurrentInstrument(state),
    instruments: robotSelectors.getInstruments(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {currentInstrument} = stateProps
  const {dispatch} = dispatchProps
  const instruments = stateProps.instruments.map(inst => {
    const isActive = inst.axis === currentInstrument
    return {
      ...inst,
      isActive,
      setInstrument: () => {
        dispatch(robotActions.setCurrentInstrument(inst.axis))
      }
    }
  })
  return {
    ...stateProps,
    instruments
  }
}
