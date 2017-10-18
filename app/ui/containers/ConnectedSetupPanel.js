import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'
import SetupPanel from '../components/SetupPanel'

const mapStateToProps = (state) => ({
  instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
  tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
  labwareConfirmed: robotSelectors.getLabwareConfirmed(state),

  instruments: robotSelectors.getInstruments(state),
  labware: robotSelectors.getLabware(state)
})

const mapDispatchToProps = (dispatch) => ({
  clearLabwareReviewed: () => dispatch(robotActions.setLabwareReviewed(false))
  // setInstrument: (axis) => () => dispatch(robotActions.setCurrentInstrument(axis)),
  // setLabware: (slot) => () => dispatch(robotActions.setCurrentLabware(slot))
})

export default connect(mapStateToProps, mapDispatchToProps)(SetupPanel)
