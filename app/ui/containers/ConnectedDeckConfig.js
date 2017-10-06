import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'
import DeckConfig from '../components/DeckConfig'

const mapStateToProps = (state) => ({
  isMoving: false,
  isOverWell: true,

  labware: robotSelectors.getLabware(state),
  currentLabware: robotSelectors.getCurrentLabware(state),
  labwareReviewed: robotSelectors.getLabwareReviewed(state),
  tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
  labwareConfirmed: robotSelectors.getLabwareConfirmed(state)
})

const mapDispatchToProps = (dispatch) => ({
  setLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed())
})

function ConnectedDeckConfig (props) {
  return (
    <DeckConfig {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedDeckConfig)
