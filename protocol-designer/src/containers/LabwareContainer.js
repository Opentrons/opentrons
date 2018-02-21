// @flow
import {connect} from 'react-redux'

import {selectors} from '../labware-ingred/reducers'
import {
  openIngredientSelector,

  createContainer,
  deleteContainer,
  modifyContainer,

  openLabwareSelector,
  closeLabwareSelector,

  setCopyLabwareMode,
  copyLabware
} from '../labware-ingred/actions'
import {selectors as steplistSelectors} from '../steplist/reducers'

import {LabwareOnDeck} from '../components/labware'

export default connect(
  (state, ownProps) => {
    const container = selectors.containersBySlot(state)[ownProps.slot]
    const containerInfo = (container)
      ? { containerType: container.type, containerId: container.containerId, containerName: container.name }
      : {}
    return {
      ...containerInfo,
      canAdd: selectors.canAdd(state),
      activeModals: selectors.activeModals(state),
      labwareToCopy: selectors.labwareToCopy(state),
      highlighted: selectors.selectedContainerSlot(state) === ownProps.slot || selectors.canAdd(state) === ownProps.slot,
      deckSetupMode: steplistSelectors.deckSetupMode(state)
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
)(LabwareOnDeck)
