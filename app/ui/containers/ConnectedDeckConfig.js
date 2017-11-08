import {connect} from 'react-redux'
import {push} from 'react-router-redux'

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
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    unconfirmedLabware: robotSelectors.getUnconfirmedLabware(state),
    unconfirmedTipracks: robotSelectors.getUnconfirmedTipracks(state),
    singleChannel: robotSelectors.getSingleChannel(state)
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const {slot} = ownProps

  return {
    setLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed()),
    moveToLabware: (axis) => () => dispatch(robotActions.moveTo(axis, slot)),
    setLabwareConfirmed: () => dispatch(robotActions.confirmLabware(slot)),
    setCurrentLabware: (axis, slot) => () => {
      dispatch(push(`/setup-deck/${slot}`))
      dispatch(robotActions.moveTo(axis, slot))
    },
    moveToNextLabware: (axis, nextSlot) => () => {
      dispatch(push(`/setup-deck/${nextSlot}`))
      dispatch(robotActions.moveTo(axis, nextSlot))
    }
  }
}

// TODO(mc, 2017-11-03): investigate whether or not we can just get access to
// dispatch and/or state in here. I think we're overcomplicating things
const mergeProps = (stateProps, dispatchProps) => {
  const props = {...stateProps, ...dispatchProps}
  const {
    singleChannel,
    moveToLabware,
    moveToNextLabware,
    unconfirmedLabware,
    unconfirmedTipracks
  } = props

  // TODO(mc, 2017-11-03): this assumes a single channel pipette will be
  // available, so revisit so we don't have to make that assumption
  props.moveToLabware = moveToLabware(singleChannel.axis)

  if (unconfirmedTipracks[0]) {
    props.nextLabware = unconfirmedTipracks[0]
    props.moveToNextLabware = moveToNextLabware(
      singleChannel.axis,
      unconfirmedTipracks[0].slot
    )
  } else if (unconfirmedLabware[0]) {
    props.nextLabware = unconfirmedLabware[0]
    props.moveToNextLabware = moveToNextLabware(
      singleChannel.axis,
      unconfirmedLabware[0].slot
    )
  }

  return props
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckConfig)
