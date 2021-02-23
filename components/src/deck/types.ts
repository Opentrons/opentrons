
import type { DeckSlot } from '@opentrons/shared-data'

export type RobotWorkSpaceRenderProps = {
  deckSlotsById: { [string]: DeckSlot },
  getRobotCoordsFromDOMCoords: (number, number) => { x: number, y: number },
}
