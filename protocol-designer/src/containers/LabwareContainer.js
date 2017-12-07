import { connect } from 'react-redux'

import { selectors } from '../reducers'
import {
  openIngredientSelector,

  createContainer,
  deleteContainer,
  modifyContainer,

  openLabwareSelector,
  closeLabwareSelector,

  setCopyLabwareMode,
  copyLabware
} from '../actions'

import LabwareContainer from '../components/LabwareContainer.js'

export default connect(
  (state, ownProps) => {
    const container = selectors.containersBySlot(state)[ownProps.slotName]
    const containerInfo = (container)
      ? { containerType: container.type, containerId: container.containerId, containerName: container.name }
      : {}
    return {
      ...containerInfo,
      canAdd: selectors.canAdd(state),
      activeModals: selectors.activeModals(state),
      labwareToCopy: selectors.labwareToCopy(state),
      highlighted: selectors.selectedContainerSlot(state) === ownProps.slotName
    }
  },
  {
    createContainer,
    deleteContainer,
    modifyContainer,

    openIngredientSelector,
    openLabwareSelector,

    closeLabwareSelector,

    setCopyLabwareMode,
    copyLabware
  }
)(LabwareContainer)
