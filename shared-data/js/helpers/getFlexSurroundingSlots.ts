import type { DeckSlotId } from '../types'

export const FLEX_GRID = [
  ['A1', 'A2', 'A3'],
  ['B1', 'B2', 'B3'],
  ['C1', 'C2', 'C3'],
  ['D1', 'D2', 'D3'],
]

const LETTER_TO_ROW_MAP: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
}

let COLS = 3 // Initial number of columns in each row
const ROWS = 4

const DIRECTIONS = [
  [-1, -1], // NW
  [-1, 0], // N
  [-1, 1], // NE
  [0, -1], // W
  [0, 1], // E
  [1, -1], // SW
  [1, 0], // S
  [1, 1], // SE
]

export const getFlexSurroundingSlots = (
  slot: DeckSlotId,
  stagingAreaSlots: DeckSlotId[]
): DeckSlotId[] => {
  // Handle staging area slots
  if (stagingAreaSlots.length > 0) {
    stagingAreaSlots.forEach((stagingSlot, index) => {
      if (stagingSlot) {
        FLEX_GRID[index].push(stagingSlot)
      }
    })
    COLS = Math.max(COLS, FLEX_GRID[0].length) // Update COLS to the maximum row length
  }

  const letter = slot.charAt(0)
  const col = parseInt(slot.charAt(1)) - 1 // Convert the column to a 0-based index
  const row = LETTER_TO_ROW_MAP[letter]

  const surroundingSlots: DeckSlotId[] = []

  // Iterate through both directions
  DIRECTIONS.forEach(([dRow, dCol]) => {
    const newRow = row + dRow
    const newCol = col + dCol

    if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
      surroundingSlots.push(FLEX_GRID[newRow][newCol])
    }
  })

  // Filter out any undefined values from the staging area slots that are not added
  return surroundingSlots.filter(slot => slot !== undefined)
}
