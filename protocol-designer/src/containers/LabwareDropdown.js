// @flow
import { connect } from 'react-redux'
import { closeLabwareSelector, createContainer } from '../labware-ingred/actions'
import { selectors } from '../labware-ingred/reducers'
import LabwareDropdown from '../components/LabwareDropdown.js'
import type {BaseState} from '../types'

export default connect(
  (state: BaseState) => ({
    slot: selectors.canAdd(state)
  }),
  (dispatch) => ({dispatch}), // TODO Ian 2018-02-19 what does flow want for no-op mapDispatchToProps?
  (stateProps, dispatchProps, ownProps) => {
    // TODO Ian 2017-12-04: Use thunks to grab slot, don't use this funky mergeprops
    const dispatch = dispatchProps.dispatch

    return {
      ...stateProps,
      ...ownProps,
      onClose: () => dispatch(closeLabwareSelector({slot: stateProps.slot})),
      onContainerChoose: containerType => dispatch(createContainer({slot: stateProps.slot, containerType}))
    }
  }
)(LabwareDropdown)
