// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { getLabware, getIsTiprackDeprecated } from '@opentrons/shared-data'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as uiLabwareSelectors } from '../ui/labware'
import { selectors as stepFormSelectors } from '../step-forms'
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
import { START_TERMINAL_ITEM_ID } from '../steplist'
import { selectors as stepsSelectors } from '../ui/steps'

import { LabwareOnDeck } from '../components/labware'
import type { StepIdType } from '../form-types'
import type { BaseState, ThunkDispatch } from '../types'
import type { DeckSlot } from '@opentrons/components'

type OP = {
  slot: DeckSlot,
}

type Props = React.ElementProps<typeof LabwareOnDeck>

type DP = {|
  addLabware: () => mixed,
  editLiquids: () => mixed,
  deleteLabware: () => mixed,
  duplicateLabware: StepIdType => mixed,
  swapSlotContents: (DeckSlot, DeckSlot) => mixed,
  setLabwareName: (name: ?string) => mixed,
  setDefaultLabwareName: () => mixed,
|}

type MP = {|
  drillDown: () => mixed,
  drillUp: () => mixed,
|}

type SP = $Diff<$Exact<Props>, { ...DP, ...MP }>

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const { slot } = ownProps
  // TODO: Ian 2019-02-14 to enable multiple deck setup steps, this needs to be timeline aware.
  // For multiple deck setup support, pick by slot without using timeline frame index is a HACK.
  const labwareNames = uiLabwareSelectors.getLabwareNicknamesById(state)
  const initialLabware = stepFormSelectors.getInitialDeckSetup(state).labware
  const selectedLabwareId = labwareIngredSelectors.getSelectedLabwareId(state)
  const selectedTerminalItem = stepsSelectors.getSelectedTerminalItemId(state)
  const addLabwareMode = labwareIngredSelectors.getLabwareSelectionMode(state)

  const labwareId = Object.keys(initialLabware).find(
    id => initialLabware[id].slot === slot
  )

  if (labwareId == null) {
    // TODO: Ian 2019-02-14 this should be easier to null out, since
    // it's totally valid for LabwareOnDeck to have no labware in its slot!
    return {
      slot,
      showNameOverlay: false,
      selectedTerminalItem,
      isTiprack: false,
      slotHasLabware: false,
      containerId: '',
      containerName: null,
      containerType: '',
      canAddIngreds: false,
      addLabwareMode,
      highlighted: false,
    }
  }
  const isSelectedSlot = selectedLabwareId === labwareId

  const labwareOnDeck: ?* = initialLabware[labwareId]
  const labwareType = labwareOnDeck && labwareOnDeck.type
  const isTiprack = labwareType ? getIsTiprackDeprecated(labwareType) : false

  const containerName = labwareNames[labwareId]
  const labwareHasName = labwareIngredSelectors.getSavedLabware(state)[
    labwareId
  ]
  const showNameOverlay = !isTiprack && !labwareHasName

  // labware definition's metadata.isValidSource defaults to true,
  // only use it when it is defined as false
  let canAddIngreds: boolean = !showNameOverlay
  const labwareInfo = labwareType ? getLabware(labwareType) : null
  if (!labwareInfo || labwareInfo.metadata.isValidSource === false) {
    canAddIngreds = false
  }

  return {
    slotHasLabware: true,
    addLabwareMode,
    canAddIngreds,
    isTiprack,

    showNameOverlay,
    highlighted:
      selectedTerminalItem === START_TERMINAL_ITEM_ID
        ? // in deckSetupMode, labware is highlighted when selected (currently editing ingredients)
          // or when targeted by an open "Add Labware" modal
          isSelectedSlot ||
          labwareIngredSelectors.selectedAddLabwareSlot(state) === slot
        : // outside of deckSetupMode, labware is highlighted when step/substep is hovered
          stepsSelectors.getHoveredStepLabware(state).includes(labwareId),
    selectedTerminalItem,

    slot,
    containerName,
    // TODO: Ian 2019-02-14 this fallback to '' is weird
    containerType: labwareType || '',
    containerId: labwareId,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> },
  ownProps: OP
): Props {
  const { slot } = ownProps
  const { dispatch } = dispatchProps
  const { containerId, containerName, containerType } = stateProps
  const labwareId = containerId // TODO Ian 2019-02-14 rename the prop

  const actions = {
    addLabware: () => dispatch(openAddLabwareModal({ slot })),
    editLiquids: () => dispatch(openIngredientSelector(labwareId)),
    deleteLabware: () =>
      window.confirm(
        `Are you sure you want to permanently delete ${containerName ||
          containerType} in slot ${slot}?`
      ) && dispatch(deleteContainer({ labwareId })),
    drillDown: () => dispatch(drillDownOnLabware(labwareId)),
    drillUp: () => dispatch(drillUpFromLabware()),
    duplicateLabware: id => dispatch(duplicateLabware(id)),
    swapSlotContents: (sourceSlot, destSlot) =>
      dispatch(swapSlotContents(sourceSlot, destSlot)),

    setLabwareName: (name: ?string) =>
      dispatch(
        renameLabware({
          labwareId,
          name,
        })
      ),
    setDefaultLabwareName: () =>
      dispatch(
        renameLabware({
          labwareId,
          name: null,
        })
      ),
  }

  return {
    ...stateProps,
    ...actions,
  }
}

export default connect<Props, OP, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(LabwareOnDeck)
