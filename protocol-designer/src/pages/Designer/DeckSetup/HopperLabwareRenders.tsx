import {
  CenterLabwareInModuleChildSlot,
  STACKER_HOPPER_LABWARE_X_OFFSET,
} from '@opentrons/components'

import { HighlightLabware } from '../HighlightLabware'
import { ModuleChildLabware } from './ModuleChildLabware'
import { LabwareControls } from './Overlays'
import { ActiveLabwareControls } from './Overlays/ActiveLabwareControls'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  DeckSlotId,
  FlexStackerStoredLabwareGroup,
  ModuleDefinition,
} from '@opentrons/shared-data'
import type {
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '/protocol-designer/step-forms'
import type { TerminalItemId } from '/protocol-designer/steplist'

interface HopperLabwareRendersProps {
  labwaresOnDeck: Record<string, LabwareOnDeckType>
  slot: DeckSlotId
  topLabwareGroup: FlexStackerStoredLabwareGroup
  allModules: ModuleOnDeck[]
  terminalItemId: TerminalItemId | null
  setHover: Dispatch<SetStateAction<string | null>>
  setShowMenuListForId: Dispatch<SetStateAction<DeckSlotId | null>>
  hover: string | null
  setHoveredLabware: Dispatch<
    SetStateAction<LabwareOnDeckType | null | undefined>
  >
  selectedZoomInSlot?: DeckSlotId
  moduleDefinition: ModuleDefinition
  deckId: string
  slotId: string
}

/**
 * HopperLabwareRenders
 *
 * Top labware group in a Flex Stacker hopper. Parent Module must use
 * childrenPositioningMode="passThrough".
 */
export function HopperLabwareRenders(
  props: HopperLabwareRendersProps
): ReactNode {
  const {
    labwaresOnDeck,
    slot,
    topLabwareGroup,
    allModules,
    terminalItemId,
    setHover,
    setShowMenuListForId,
    hover,
    setHoveredLabware,
    selectedZoomInSlot,
    moduleDefinition,
    deckId,
    slotId,
  } = props
  const { primaryLabwareId, adapterLabwareId, lidLabwareId } = topLabwareGroup
  const primaryLabware = labwaresOnDeck[primaryLabwareId]
  if (primaryLabware == null) {
    return null
  }
  const labwareInterfaceBoundingBox = {
    xDimension: primaryLabware.def.dimensions.xDimension,
    yDimension: primaryLabware.def.dimensions.yDimension,
    zDimension: 0,
  }
  // TODO: replace this static hopper X offset with one from the module def.
  const hopperOffset: [number, number, number] = [
    STACKER_HOPPER_LABWARE_X_OFFSET,
    0,
    0,
  ]

  return (
    <>
      {adapterLabwareId != null && labwaresOnDeck[adapterLabwareId] != null ? (
        <ModuleChildLabware
          labwareOnDeck={labwaresOnDeck[adapterLabwareId]}
          moduleDefinition={moduleDefinition}
          deckId={deckId}
          slotId={slotId}
          xOffset={STACKER_HOPPER_LABWARE_X_OFFSET}
        />
      ) : null}
      <ModuleChildLabware
        labwareOnDeck={primaryLabware}
        moduleDefinition={moduleDefinition}
        deckId={deckId}
        slotId={slotId}
        xOffset={STACKER_HOPPER_LABWARE_X_OFFSET}
      />
      {lidLabwareId != null && labwaresOnDeck[lidLabwareId] != null ? (
        <ModuleChildLabware
          labwareOnDeck={labwaresOnDeck[lidLabwareId]}
          moduleDefinition={moduleDefinition}
          deckId={deckId}
          slotId={slotId}
          xOffset={STACKER_HOPPER_LABWARE_X_OFFSET}
        />
      ) : null}
      {/* Align+center like ModuleChildLabware; hopper X via position props. */}
      <CenterLabwareInModuleChildSlot
        moduleDefinition={moduleDefinition}
        slotId={slotId}
        deckId={deckId}
        labwareDefinition={primaryLabware.def}
      >
        <HighlightLabware
          labwareOnDeck={primaryLabware}
          position={hopperOffset}
          isZoomed={selectedZoomInSlot != null}
        />
        <LabwareControls
          terminalItemId={terminalItemId}
          itemId={`hopper${slot}`}
          setHover={setHover}
          setShowMenuListForId={setShowMenuListForId}
          hover={hover}
          slotPosition={hopperOffset}
          setHoveredLabware={setHoveredLabware}
          swapBlocked={false}
          labwareOnDeck={primaryLabware}
          isSelected={selectedZoomInSlot != null}
          allModules={allModules}
        />
        <ActiveLabwareControls
          itemId={`hopper${slot}`}
          slotPosition={hopperOffset}
          hover={hover}
          setHover={setHover}
          slotBoundingBox={labwareInterfaceBoundingBox}
          terminalItemId={terminalItemId}
        />
      </CenterLabwareInModuleChildSlot>
    </>
  )
}
