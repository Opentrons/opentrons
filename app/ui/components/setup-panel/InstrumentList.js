import React from 'react'
import {connect} from 'react-redux'
import {
  actions as robotActions,
  selectors as robotSelectors
} from '../../robot'

import {TitledList, FLASK} from '@opentrons/components'
import InstrumentListItem from './InstrumentListItem'

export default connect(mapStateToProps, mapDispatchToProps)(InstrumentList)

function InstrumentList (props) {
  const title = 'Pipette Setup'
  // PROOF OF CONCEPT: titled list with icon
  const iconName = FLASK
  return (
    <TitledList title={title} iconName={iconName}>
      {props.instruments.map((instrument) => (
        <InstrumentListItem key={instrument.axis} {...props} {...instrument} />
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
