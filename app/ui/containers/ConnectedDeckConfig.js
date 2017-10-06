import React from 'react'
import {connect} from 'react-redux'

import {selectors as robotSelectors} from '../robot'
import DeckConfig from '../components/DeckConfig'

const mapStateToProps = (state) => ({
  currentLabware: robotSelectors.getCurrentLabware(state),
  labware: robotSelectors.getLabware(state),
  tipracksAreConfirmed: robotSelectors.getTipracksAreConfirmed(state),
  isMoving: false,
  isOverWell: true,
  isDeckmapReviewed: true,
  isLabwareConfirmed: false
})

function ConnectedDeckConfig (props) {
  return (
    <DeckConfig {...props} />
  )
}

export default connect(mapStateToProps)(ConnectedDeckConfig)
