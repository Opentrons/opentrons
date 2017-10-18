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
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    labware,
    currentLabware,
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    unconfirmedLabware: robotSelectors.getUnconfirmedLabware(state),
    unconfirmedTipracks: robotSelectors.getUnconfirmedTipracks(state)
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const {slot} = ownProps

  return {
    setLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed()),
    // TODO(mc, 2017-10-06): don't hardcode the pipette
    moveToLabware: () => dispatch(robotActions.moveTo('right', slot)),
    setLabwareConfirmed: () => dispatch(robotActions.confirmLabware(slot)),
    moveToNextLabware: (nextSlot) => () => {
      dispatch(push(`/setup-deck/${nextSlot}`))
      dispatch(robotActions.moveTo('right', nextSlot))
    }
  }
}

const mergeProps = (stateProps, dispatchProps) => {
  const props = {...stateProps, ...dispatchProps}
  const {moveToNextLabware, unconfirmedLabware, unconfirmedTipracks} = props

  if (unconfirmedTipracks[0]) {
    props.nextLabware = unconfirmedTipracks[0]
    props.moveToNextLabware = moveToNextLabware(unconfirmedTipracks[0].slot)
  } else if (unconfirmedLabware[0]) {
    props.nextLabware = unconfirmedLabware[0]
    props.moveToNextLabware = moveToNextLabware(unconfirmedLabware[0].slot)
  }

  return props
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DeckConfig)
