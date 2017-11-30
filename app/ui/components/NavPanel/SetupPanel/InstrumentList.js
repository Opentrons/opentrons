import React from 'react'
import {connect} from 'react-redux'
import {
  selectors as robotSelectors
} from '../../../robot'

import TitledList from './TitledList'
import InstrumentListItem from './InstrumentListItem'

export default connect(mapStateToProps)(InstrumentList)

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

function mapStateToProps (state) {
  return {
    instruments: robotSelectors.getInstruments(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}
