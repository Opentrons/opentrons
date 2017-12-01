// Confirm Labware Container
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import ReviewPrompt from './ReviewPrompt'

const mapStateToProps = (state, ownProps) => {
  const {slot} = ownProps
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lab) => lab.slot === slot)

  return {
    currentLabware,
    labware,
    singleChannel: robotSelectors.getSingleChannel(state)
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {currentLabware: {isTiprack}, singleChannel: {axis}} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps

  return {
    ...stateProps,
    ...ownProps,
    setLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed()),
    // TODO(mc, 2017-11-29): DRY (logic shared by NextLabware, ReviewLabware,
    // Deck, and ConnectedSetupPanel); could also move logic to the API client
    moveToLabware: () => {
      if (isTiprack) return dispatch(robotActions.pickupAndHome(axis, slot))
      dispatch(robotActions.moveTo(axis, slot))
    }
  }
}

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(ReviewPrompt)
