import { connect } from 'react-redux'
import { closeLabwareSelector, createContainer } from '../actions'
import { selectors } from '../reducers'
import LabwareDropdown from '../components/LabwareDropdown.js'

export default connect(
  state => ({
    slotName: selectors.canAdd(state)
  }),
  null,
  (stateProps, dispatchProps, ownProps) => {
    // TODO Ian 2017-12-04: Use thunks to grab slotName, don't use this funky mergeprops
    const dispatch = dispatchProps.dispatch

    return {
      ...stateProps,
      ...ownProps,
      onClose: () => dispatch(closeLabwareSelector({slotName: stateProps.slotName})),
      onContainerChoose: containerType => dispatch(createContainer({slotName: stateProps.slotName, containerType}))
    }
  }
)(LabwareDropdown)
