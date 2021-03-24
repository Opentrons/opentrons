import type { DeckSlot } from '@opentrons/shared-data'

export interface RobotWorkSpaceRenderProps {
  deckSlotsById: Record<string, DeckSlot>
  getRobotCoordsFromDOMCoords: (
    domX: number,
    domY: number
  ) => { x: number; y: number }
}
