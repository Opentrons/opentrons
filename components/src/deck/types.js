// @flow
import type { DeckSlot } from '@opentrons/shared-data'

export type RobotWorkSpaceRenderProps = {
  slots: { [string]: DeckSlot },
  getRobotCoordsFromDOMCoords: (number, number) => { x: number, y: number },
}
