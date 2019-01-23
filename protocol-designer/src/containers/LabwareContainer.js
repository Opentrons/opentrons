// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {getLabware, getIsTiprack} from '@opentrons/shared-data'
import {selectors} from '../labware-ingred/selectors'
import {
  openIngredientSelector,
  deleteContainer,
  renameLabware,
  openAddLabwareModal,
  drillDownOnLabware,
  drillUpFromLabware,
  duplicateLabware,
  swapSlotContents,
} from '../labware-ingred/actions'
import {START_TERMINAL_ITEM_ID} from '../steplist'
import {selectors as stepsSelectors} from '../ui/steps'

import {LabwareOnDeck} from '../components/labware'
import type {StepIdType} from '../form-types'
import type {BaseState} from '../types'
import type {DeckSlot} from '@opentrons/components'

type OP = {
  slot: DeckSlot,
}

type Props = React.ElementProps<typeof LabwareOnDeck>

type DP = {
  addLabware: () => mixed,
  editLiquids: () => mixed,
  deleteLabware: () => mixed,
  duplicateLabware: (StepIdType) => mixed,
  swapSlotContents: (DeckSlot, DeckSlot) => void,
  setLabwareName: (name: ?string) => mixed,
  setDefaultLabwareName: () => mixed,
}

type MP = {
  drillDown: () => mixed,
  drillUp: () => mixed,
}

type SP = $Diff<Props, {...DP, ...MP}>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {slot} = ownProps
  const container = selectors.containersBySlot(state)[ownProps.slot]
  const labwareNames = selectors.getLabwareNicknamesById(state)

  const containerType = container && container.type
  const containerId = container && container.id
  const containerName = containerId && labwareNames[containerId]

  const selectedContainer = selectors.getSelectedLabware(state)
  const isSelectedSlot = !!(selectedContainer && selectedContainer.slot === slot)

  const selectedTerminalItem = stepsSelectors.getSelectedTerminalItemId(state)
  const labwareHasName = container && selectors.getSavedLabware(state)[containerId]
  const isTiprack = getIsTiprack(containerType)
  const showNameOverlay = container && !isTiprack && !labwareHasName

  const slotHasLabware = !!containerType
  const addLabwareMode = selectors.getLabwareSelectionMode(state)

  const setDefaultLabwareName = () => renameLabware({
    labwareId: containerId,
    name: null,
  })

  // labware definition's metadata.isValidSource defaults to true,
  // only use it when it is defined as false
  let canAddIngreds: boolean = !showNameOverlay
  const labwareInfo = getLabware(containerType)
  if (!labwareInfo || labwareInfo.metadata.isValidSource === false) {
    canAddIngreds = false
  }

  return {
    slotHasLabware,
    addLabwareMode,
    setDefaultLabwareName,
    canAddIngreds,
    isTiprack,
    labwareInfo,

    showNameOverlay,
    highlighted: selectedTerminalItem === START_TERMINAL_ITEM_ID
    // in deckSetupMode, labware is highlighted when selected (currently editing ingredients)
    // or when targeted by an open "Add Labware" modal
      ? (isSelectedSlot || selectors.selectedAddLabwareSlot(state) === slot)
    // outside of deckSetupMode, labware is highlighted when step/substep is hovered
      : stepsSelectors.getHoveredStepLabware(state).includes(containerId),
    selectedTerminalItem,

    slot,
    containerName,
    containerType,
    containerId,
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}, ownProps: OP): Props {
  const {slot} = ownProps
  const {dispatch} = dispatchProps
  const {containerId, containerName, containerType} = stateProps

  const actions = {
    addLabware: () => dispatch(openAddLabwareModal({slot})),
    editLiquids: () => dispatch(openIngredientSelector(containerId)),
    deleteLabware: () => (
      window.confirm(`Are you sure you want to permanently delete ${containerName || containerType} in slot ${slot}?`) &&
      dispatch(deleteContainer({containerId, slot, containerType}))
    ),
    drillDown: () => dispatch(drillDownOnLabware(containerId)),
    drillUp: () => dispatch(drillUpFromLabware()),
    duplicateLabware: (id) => dispatch(duplicateLabware(id)),
    swapSlotContents: (sourceSlot, destSlot) => dispatch(swapSlotContents(sourceSlot, destSlot)),

    setLabwareName: (name: ?string) => dispatch(renameLabware({
      labwareId: containerId,
      name,
    })),
    setDefaultLabwareName: () => dispatch(renameLabware({
      labwareId: containerId,
      name: null,
    })),
  }

  return {
    ...stateProps,
    ...actions,
  }
}

export default connect(mapStateToProps, null, mergeProps)(LabwareOnDeck)
