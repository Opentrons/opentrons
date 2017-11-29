import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'
import SetupPanel from '../components/SetupPanel'

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(SetupPanel)

function mapStateToProps (state) {
  return {
    instruments: robotSelectors.getInstruments(state),
    labware: robotSelectors.getLabware(state),
    labwareBySlot: robotSelectors.getLabwareBySlot(state),
    labwareReviewed: robotSelectors.getLabwareReviewed(state),
    instrumentsCalibrated: robotSelectors.getInstrumentsCalibrated(state),
    tipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
    labwareConfirmed: robotSelectors.getLabwareConfirmed(state),
    singleChannel: robotSelectors.getSingleChannel(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}

function mergeProps (stateProps, dispatchProps) {
  const {labwareReviewed, labwareBySlot, singleChannel} = stateProps
  const {dispatch} = dispatchProps

  return {
    ...stateProps,
    run: () => dispatch(robotActions.run()),
    clearLabwareReviewed: () => {
      dispatch(robotActions.setLabwareReviewed(false))
    },
    setLabware: (slot) => () => {
      const {isTiprack} = labwareBySlot[slot] || {}

      // TODO(mc, 2017-10-06): use nav link instead of double dispatch (PR 426)
      dispatch(push(`/setup-deck/${slot}`))

      // TODO(mc, 2017-11-29): DRY (logic shared by NextLabware, ReviewLabware,
      // Deck, and ConnectedSetupPanel); could also move logic to the API client
      if (labwareReviewed) {
        if (isTiprack) {
          return dispatch(robotActions.pickupAndHome(singleChannel.axis, slot))
        }
        dispatch(robotActions.moveTo(singleChannel.axis, slot))
      }
    }
  }
}
