// @flow
import * as React from 'react'
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

type Props = React.ElementProps<typeof LabwareOnDeck>

type DispatchProps = {
  createContainer: mixed,
  deleteContainer: mixed,
  modifyContainer: mixed,

  openIngredientSelector: mixed,
  openLabwareSelector: mixed,

  closeLabwareSelector: mixed,

  setCopyLabwareMode: mixed,
  copyLabware: mixed
}

type StateProps = $Diff<Props, DispatchProps>

function mapStateToProps (state: BaseState, ownProps: OwnProps): StateProps {
  const {slot} = ownProps
  const container = selectors.containersBySlot(state)[ownProps.slot]
  const containerInfo = (container)
    ? { containerType: container.type, containerId: container.containerId, containerName: container.name }
    : {}

  const deckSetupMode = steplistSelectors.deckSetupMode(state)
  return {
    ...containerInfo,
    slot,
    canAdd: selectors.canAdd(state),
    activeModals: selectors.activeModals(state),
    labwareToCopy: selectors.labwareToCopy(state),
    highlighted: (deckSetupMode)
      // in deckSetupMode, labware is highlighted when selected (currently editing ingredients)
      // or when targeted by an open "Add Labware" modal
      ? (selectors.selectedContainerSlot(state) === slot ||
      selectors.canAdd(state) === slot)
      // outside of deckSetupMode, labware is highlighted when step/substep is hovered
      : steplistSelectors.hoveredStepLabware(state).includes(container && container.containerId),
    deckSetupMode
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
