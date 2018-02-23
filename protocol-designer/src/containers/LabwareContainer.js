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
import type {BaseState} from '../types'
import type {DeckSlot} from '@opentrons/components'

type OwnProps = {
  slot: DeckSlot
}

function mapStateToProps (state: BaseState, ownProps: OwnProps) {
  const container = selectors.containersBySlot(state)[ownProps.slot]
  const containerInfo = (container)
    ? { containerType: container.type, containerId: container.containerId, containerName: container.name }
    : {}
  return {
    ...containerInfo,
    canAdd: selectors.canAdd(state),
    activeModals: selectors.activeModals(state),
    labwareToCopy: selectors.labwareToCopy(state),
    highlighted: selectors.selectedContainerSlot(state) === ownProps.slot ||
      selectors.canAdd(state) === ownProps.slot,
    deckSetupMode: steplistSelectors.deckSetupMode(state)
  }
}

const dispatchObj = {
  createContainer,
  deleteContainer,
  modifyContainer,

  openIngredientSelector,
  openLabwareSelector,

  closeLabwareSelector,

  setCopyLabwareMode,
  copyLabware
}

export default connect(mapStateToProps, dispatchObj)(LabwareOnDeck)
