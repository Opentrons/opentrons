import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'
import SetupPanel from '../components/SetupPanel'

const mapStateToProps = (state) => ({
  instruments: robotSelectors.getInstruments(state),
  labware: robotSelectors.getLabware(state),
  labwareReviewed: robotSelectors.getLabwareReviewed(state),
  instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
  tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
  labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
  singleChannel: robotSelectors.getSingleChannel(state)
})

const mapDispatchToProps = (dispatch) => ({
  clearLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed(false)),
  setLabware: (slot) => () => dispatch(push(`/setup-deck/${slot}`)),
  moveToLabware: (axis, slot) => () => dispatch(robotActions.moveTo(axis, slot))
})

const mergeProps = (stateProps, dispatchProps) => {
  const props = {...stateProps, ...dispatchProps}

  // TODO(mc, 2017-11-03): this assumes a single channel pipette will be
  // available, so revisit so we don't have to make that assumption
  if (props.labwareReviewed) {
    const {singleChannel, setLabware, moveToLabware} = props

    props.setLabware = (slot) => () => {
      // TODO(mc, 2017-10-06): batch or rethink this double dispatch
      setLabware(slot)()
      moveToLabware(singleChannel.axis, slot)()
    }
  }

  return props
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(SetupPanel)
