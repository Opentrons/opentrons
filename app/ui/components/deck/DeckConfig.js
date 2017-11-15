import {connect} from 'react-redux'

import {
  selectors as robotSelectors
} from '../../robot'

import CalibrateDeck from './CalibrateDeck'

const mapStateToProps = (state, ownProps) => {
  const {slot} = ownProps
  return {
    slot,
    labwareReviewed: robotSelectors.getLabwareReviewed(state)
  }
}

export default connect(mapStateToProps)(CalibrateDeck)
