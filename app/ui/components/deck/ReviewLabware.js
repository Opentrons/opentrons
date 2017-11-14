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
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    unconfirmedTipracks: robotSelectors.getUnconfirmedTipracks(state),
    unconfirmedLabware: robotSelectors.getUnconfirmedLabware(state),
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    singleChannel: robotSelectors.getSingleChannel(state)
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {singleChannel: {axis}} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps
  return {
    ...stateProps,
    ...ownProps,
    setLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed()),
    moveToLabware: () => dispatch(robotActions.moveTo(axis, slot))
  }
}

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(ReviewPrompt)
