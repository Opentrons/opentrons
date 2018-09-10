// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {getLabware} from '@opentrons/shared-data'
import {selectors} from '../labware-ingred/reducers'
import {
  openIngredientSelector,

  createContainer,
  deleteContainer,
  modifyContainer,

  openLabwareSelector,
  closeLabwareSelector,

  setMoveLabwareMode,
  moveLabware
} from '../labware-ingred/actions'
import {selectors as steplistSelectors, START_TERMINAL_ITEM_ID} from '../steplist'

import {LabwareOnDeck} from '../components/labware'
import type {BaseState} from '../types'
import type {DeckSlot} from '@opentrons/components'

type OwnProps = {
  slot: DeckSlot
}

type Props = React.ElementProps<typeof LabwareOnDeck>

type DispatchProps = {
  createContainer: mixed,
  deleteContainer: mixed,
  modifyContainer: mixed,

  openIngredientSelector: mixed,
  openLabwareSelector: mixed,

  closeLabwareSelector: mixed,

  setMoveLabwareMode: mixed,
  moveLabware: mixed
}

type StateProps = $Diff<Props, DispatchProps>

function mapStateToProps (state: BaseState, ownProps: OwnProps): StateProps {
  const {slot} = ownProps
  const container = selectors.containersBySlot(state)[ownProps.slot]
  const labwareNames = selectors.getLabwareNames(state)
  const containerInfo = (container)
    ? {containerType: container.type, containerId: container.id, containerName: labwareNames[container.id]}
    : {}

  const selectedContainer = selectors.getSelectedContainer(state)
  const isSelectedSlot = !!(selectedContainer && selectedContainer.slot === slot)

  const deckSetupMode = steplistSelectors.getSelectedTerminalItemId(state) === START_TERMINAL_ITEM_ID
  const labwareHasName = container && selectors.getSavedLabware(state)[container.id]
  const labwareData = container && getLabware(container.type)
  // TODO: Ian 2018-07-10 use shared-data accessor
  const isTiprack = labwareData && labwareData.metadata.isTiprack

  return {
    ...containerInfo,
    slot,
    showNameOverlay: container && !isTiprack && !labwareHasName,
    canAdd: selectors.canAdd(state),
    activeModals: selectors.activeModals(state),
    slotToMoveFrom: selectors.slotToMoveFrom(state),
    highlighted: (deckSetupMode)
      // in deckSetupMode, labware is highlighted when selected (currently editing ingredients)
      // or when targeted by an open "Add Labware" modal
      ? (isSelectedSlot || selectors.canAdd(state) === slot)
      // outside of deckSetupMode, labware is highlighted when step/substep is hovered
      : steplistSelectors.hoveredStepLabware(state).includes(container && container.id),
    deckSetupMode
  }
}

const mapDispatchToProps = {
  createContainer,
  deleteContainer,
  modifyContainer,

  openIngredientSelector,
  openLabwareSelector,

  closeLabwareSelector,

  setMoveLabwareMode,
  moveLabware
}

export default connect(mapStateToProps, mapDispatchToProps)(LabwareOnDeck)
