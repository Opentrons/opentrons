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
  labwareConfirmed: robotSelectors.getLabwareConfirmed(state)
})

const mapDispatchToProps = (dispatch) => ({
  clearLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed(false)),
  setLabware: (slot) => () => dispatch(push(`/setup-deck/${slot}`)),
  // TODO(mc, 2017-10-06): don't hardcode the pipette
  moveToLabware: (slot) => () => dispatch(robotActions.moveTo('left', slot))
})

const mergeProps = (stateProps, dispatchProps) => {
  const props = {...stateProps, ...dispatchProps}

  if (props.labwareReviewed) {
    const setLabware = props.setLabware
    const moveToLabware = props.moveToLabware

    props.setLabware = (slot) => () => {
      // TODO(mc, 2017-10-06): batch or rethink this double dispatch
      setLabware(slot)()
      moveToLabware(slot)()
    }
  }

  return props
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(SetupPanel)
