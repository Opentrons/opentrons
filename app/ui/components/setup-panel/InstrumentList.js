import React from 'react'
import {connect} from 'react-redux'
import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import TitledList from './TitledList'
import InstrumentListItem from './InstrumentListItem'

export default connect(mapStateToProps, mapDispatchToProps)(InstrumentList)

function InstrumentList (props) {
  const title = 'Pipette Setup'
  return (
    <TitledList title={title}>
      {props.instruments.map((instrument) => (
        <InstrumentListItem key={instrument.name} {...props} {...instrument} />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state, ownProps) {
  return {
    instruments: robotSelectors.getInstruments(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed(false))
  }
}
