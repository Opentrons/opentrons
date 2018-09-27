// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {getLabware, getIsTiprack} from '@opentrons/shared-data'
import {selectors} from '../labware-ingred/reducers'
import {
  openIngredientSelector,

  deleteContainer,
  modifyContainer,

  openAddLabwareModal,

  setMoveLabwareMode,
  moveLabware,
} from '../labware-ingred/actions'
import {selectors as steplistSelectors, START_TERMINAL_ITEM_ID} from '../steplist'

import {LabwareOnDeck} from '../components/labware'
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

  cancelMove: () => mixed,
  moveLabwareDestination: () => mixed,
  moveLabwareSource: () => mixed,

  setLabwareName: (name: ?string) => mixed,
  setDefaultLabwareName: () => mixed,
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {slot} = ownProps
  const container = selectors.containersBySlot(state)[ownProps.slot]
  const labwareNames = selectors.getLabwareNames(state)

  const containerType = container && container.type
  const containerId = container && container.id
  const containerName = containerId && labwareNames[containerId]

  const selectedContainer = selectors.getSelectedContainer(state)
  const isSelectedSlot = !!(selectedContainer && selectedContainer.slot === slot)

  const deckSetupMode = steplistSelectors.getSelectedTerminalItemId(state) === START_TERMINAL_ITEM_ID
  const labwareHasName = container && selectors.getSavedLabware(state)[containerId]
  const isTiprack = getIsTiprack(containerType)
  const showNameOverlay = container && !isTiprack && !labwareHasName

  const slotToMoveFrom = selectors.slotToMoveFrom(state)
  const activeModals = selectors.activeModals(state)

  const slotHasLabware = !!containerType
  const addLabwareMode = activeModals.labwareSelection
  const moveLabwareMode = Boolean(slotToMoveFrom)

  const setDefaultLabwareName = () => modifyContainer({
    containerId,
    modify: {name: null},
  })

  // labware definition's metadata.isValueSource defaults to true,
  // only use it when it's defined as false
  let canAddIngreds: boolean = !showNameOverlay
  const labwareInfo = getLabware(containerType)
  if (!labwareInfo || labwareInfo.metadata.isValidSource === false) {
    canAddIngreds = false
  }

  return {
    slotHasLabware,
    addLabwareMode,
    moveLabwareMode,
    setDefaultLabwareName,
    canAddIngreds,
    labwareInfo,

    showNameOverlay,
    slotToMoveFrom,
    highlighted: (deckSetupMode)
    // in deckSetupMode, labware is highlighted when selected (currently editing ingredients)
    // or when targeted by an open "Add Labware" modal
    ? (isSelectedSlot || selectors.selectedAddLabwareSlot(state) === slot)
    // outside of deckSetupMode, labware is highlighted when step/substep is hovered
    : steplistSelectors.hoveredStepLabware(state).includes(containerId),
    deckSetupMode,

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

    cancelMove: () => dispatch(setMoveLabwareMode()),
    moveLabwareDestination: () => dispatch(moveLabware(slot)),
    moveLabwareSource: () => dispatch(setMoveLabwareMode(slot)),

    setLabwareName: (name: ?string) => dispatch(modifyContainer({
      containerId,
      modify: {name},
    })),
    setDefaultLabwareName: () => dispatch(modifyContainer({
      containerId,
      modify: {name: null},
    })),
  }

  return {
    ...stateProps,
    ...actions,
  }
}

export default connect(mapStateToProps, null, mergeProps)(LabwareOnDeck)
