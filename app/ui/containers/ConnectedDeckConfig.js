import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'
import DeckConfig from '../components/DeckConfig'

const mapStateToProps = (state, ownProps) => {
  const {slot} = ownProps
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lab) => lab.slot === slot)

  return {
    labware,
    currentLabware,
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state)
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const {slot} = ownProps

  return {
    setLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed()),
    // TODO(mc, 2017-10-06): don't hardcode the pipette
    moveToContainer: () => dispatch(robotActions.moveTo('left', slot)),
    setLabwareConfirmed: () => dispatch(robotActions.confirmLabware(slot))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeckConfig)
