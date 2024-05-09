import { FLEX_GRID } from './getFlexSurroundingSlots'
import type { DeckSlotId } from '../types'

export const getAreFlexSlotsAdjacent = (
  slot1: DeckSlotId,
  slot2: DeckSlotId
): boolean => {
  const findSlotPosition = (slot: DeckSlotId): [number, number] | null => {
    for (let row = 0; row < FLEX_GRID.length; row++) {
      const col = FLEX_GRID[row].indexOf(slot)
      if (col !== -1) {
        return [row, col]
      }
    }
    return null
  }

  const pos1 = findSlotPosition(slot1)
  const pos2 = findSlotPosition(slot2)

  if (pos1 === null || pos2 === null) {
    return false
  }

  const [row1, col1] = pos1
  const [row2, col2] = pos2

  const rowDiff = Math.abs(row1 - row2)
  const colDiff = Math.abs(col1 - col2)

  if ((rowDiff === 1 && colDiff <= 1) || (rowDiff === 0 && colDiff === 1)) {
    return true
  }

  return false
}
