// deck map container
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import DeckMap from './DeckMap'

const mapStateToProps = (state) => {
  const labware = robotSelectors.getLabware(state)
  return {
    labware,
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    singleChannel: robotSelectors.getSingleChannel(state)
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {singleChannel: {axis}} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps || {}
  const labware = stateProps.labware.map(lw => ({
    ...lw,
    isCurrent: (lw.slot === slot),
    // TODO(mc, 2017-11-29): DRY (logic shared by NextLabware, ReviewLabware,
    // Deck, and ConnectedSetupPanel); could also move logic to the API client
    moveToLabware: () => {
      if (lw.isTiprack) {
        return dispatch(robotActions.pickupAndHome(axis, lw.slot))
      }
      dispatch(robotActions.moveTo(axis, lw.slot))
    },
    setLabwareConfirmed: () => dispatch(robotActions.confirmLabware(lw.slot))
  }))

  return {
    ...stateProps,
    ...ownProps,
    labware
  }
}
export default connect(mapStateToProps, null, mergeProps)(DeckMap)
