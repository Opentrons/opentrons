import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { HOPPER_LABWARE_X_OFFSET } from '/protocol-designer/constants'

import { HighlightLabware } from '../HighlightLabware'
import { LabwareControls } from './Overlays'
import { ActiveLabwareControls } from './Overlays/ActiveLabwareControls'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  DeckSlotId,
  FlexStackerStoredLabwareGroup,
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
}

/**
 * HopperLabwareRenders
 *
 * This component renders the labware items of the top group of labware in the hopper of a given Flex Stacker module.
 * It should be called as a child of the hardware-sim `Module` component for proper positioning.
 *
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
  return (
    <>
      {adapterLabwareId != null && labwaresOnDeck[adapterLabwareId] != null ? (
        <LabwareOnDeck
          x={HOPPER_LABWARE_X_OFFSET}
          y={0}
          labwareOnDeck={labwaresOnDeck[adapterLabwareId]}
        />
      ) : null}
      <LabwareOnDeck
        x={HOPPER_LABWARE_X_OFFSET}
        y={0}
        labwareOnDeck={primaryLabware}
      />
      {lidLabwareId != null && labwaresOnDeck[lidLabwareId] != null ? (
        <LabwareOnDeck
          x={HOPPER_LABWARE_X_OFFSET}
          y={0}
          labwareOnDeck={labwaresOnDeck[lidLabwareId]}
        />
      ) : null}
      <HighlightLabware
        labwareOnDeck={primaryLabware}
        position={[HOPPER_LABWARE_X_OFFSET, 0, 0]}
        isZoomed={selectedZoomInSlot != null}
      />
      <LabwareControls
        terminalItemId={terminalItemId}
        itemId={`hopper${slot}`}
        setHover={setHover}
        setShowMenuListForId={setShowMenuListForId}
        hover={hover}
        slotPosition={[HOPPER_LABWARE_X_OFFSET, 0, 0]} // Module Component already handles nested positioning
        setHoveredLabware={setHoveredLabware}
        swapBlocked={false}
        labwareOnDeck={primaryLabware}
        isSelected={selectedZoomInSlot != null}
        allModules={allModules}
      />
      <ActiveLabwareControls
        itemId={`hopper${slot}`}
        slotPosition={[HOPPER_LABWARE_X_OFFSET, 0, 0]}
        hover={hover}
        setHover={setHover}
        slotBoundingBox={labwareInterfaceBoundingBox}
        terminalItemId={terminalItemId}
      />
    </>
  )
}
