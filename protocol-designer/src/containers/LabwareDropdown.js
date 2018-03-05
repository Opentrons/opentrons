// @flow
import { connect } from 'react-redux'
import type {Dispatch} from 'redux'
import { closeLabwareSelector, createContainer } from '../labware-ingred/actions'
import { selectors } from '../labware-ingred/reducers'
import LabwareDropdown from '../components/LabwareDropdown.js'
import type {BaseState} from '../types'

export default connect(
  (state: BaseState) => ({
    slot: selectors.canAdd(state)
  }),
  (dispatch: Dispatch<*>) => ({dispatch}), // TODO Ian 2018-02-19 what does flow want for no-op mapDispatchToProps?
  (stateProps, dispatchProps: {dispatch: Dispatch<*>}) => {
    // TODO Ian 2017-12-04: Use thunks to grab slot, don't use this funky mergeprops
    const dispatch = dispatchProps.dispatch

    return {
      ...stateProps,
      onClose: () => {
        dispatch(closeLabwareSelector())
      },
      onContainerChoose: (containerType) => {
        if (stateProps.slot) {
          dispatch(createContainer({slot: stateProps.slot, containerType}))
        }
      }
    }
  }
)(LabwareDropdown)
