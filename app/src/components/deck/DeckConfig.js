import {connect} from 'react-redux'

import {
  selectors as robotSelectors
} from '../../robot'

import CalibrateDeck from './CalibrateDeck'

const mapStateToProps = (state) => ({
  deckPopulated: robotSelectors.getDeckPopulated(state)
})

export default connect(mapStateToProps)(CalibrateDeck)
