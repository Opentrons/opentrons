import { VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA } from '@opentrons/shared-data'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'

import { HighlightLabware } from '../HighlightLabware'
import { LabwareControls } from './Overlays'
import { ActiveLabwareControls } from './Overlays/ActiveLabwareControls'

import type { Dispatch, SetStateAction } from 'react'
import type { DeckSlotId } from '@opentrons/shared-data'
import type {
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '/protocol-designer/step-forms'
import type { TerminalItemId } from '/protocol-designer/steplist'

interface VacuumDockLabwareRendersProps {
  labwaresOnDeck: Record<string, LabwareOnDeckType>
  dockLabwareStack: string[] // Array of labware IDs on the dock
  allModules: ModuleOnDeck[]
  terminalItemId: TerminalItemId | null
  setHover: Dispatch<SetStateAction<string | null>>
  setShowMenuListForId: Dispatch<SetStateAction<DeckSlotId | null>>
  hover: string | null
  setHoveredLabware: Dispatch<
    SetStateAction<LabwareOnDeckType | null | undefined>
  >
  setDraggedLabware: Dispatch<
    SetStateAction<LabwareOnDeckType | null | undefined>
  >
  selectedZoomInSlot?: DeckSlotId
  x: number
  y: number
}

export function VacuumDockLabwareRenders(
  props: VacuumDockLabwareRendersProps
): JSX.Element | null {
  const {
    labwaresOnDeck,
    dockLabwareStack,
    allModules,
    terminalItemId,
    setHover,
    setShowMenuListForId,
    hover,
    setHoveredLabware,
    setDraggedLabware,
    selectedZoomInSlot,
    x,
    y,
  } = props

  if (dockLabwareStack.length === 0) {
    return null
  }

  // Get the top-most labware on the dock
  const topLabwareId = dockLabwareStack[0]
  const topLabware = labwaresOnDeck[topLabwareId]

  if (topLabware == null) {
    return null
  }

  const labwareInterfaceBoundingBox = {
    xDimension: topLabware.def.dimensions.xDimension,
    yDimension: topLabware.def.dimensions.yDimension,
    zDimension: 0,
  }

  return (
    <>
      {/* Render all labware in the stack (bottom to top) */}
      {[...dockLabwareStack].reverse().map(labwareId => {
        const labware = labwaresOnDeck[labwareId]
        return labware ? (
          <LabwareOnDeck key={labwareId} x={x} y={y} labwareOnDeck={labware} />
        ) : null
      })}
      <HighlightLabware
        labwareOnDeck={topLabware}
        position={[x, y, 0]}
        isZoomed={selectedZoomInSlot != null}
      />
      <LabwareControls
        terminalItemId={terminalItemId}
        itemId={VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA}
        setHover={setHover}
        setShowMenuListForId={setShowMenuListForId}
        hover={hover}
        slotPosition={[x, y, 0]}
        setHoveredLabware={setHoveredLabware}
        setDraggedLabware={setDraggedLabware}
        swapBlocked={false}
        labwareOnDeck={topLabware}
        isSelected={selectedZoomInSlot != null}
        allModules={allModules}
      />
      <ActiveLabwareControls
        itemId={VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA}
        slotPosition={[x, y, 0]}
        hover={hover}
        setHover={setHover}
        slotBoundingBox={labwareInterfaceBoundingBox}
        terminalItemId={terminalItemId}
      />
    </>
  )
}
