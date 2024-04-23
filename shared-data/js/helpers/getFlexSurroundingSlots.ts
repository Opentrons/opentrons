import type { DeckSlotId } from '../types'

const FLEX_GRID = [
  ['A1', 'A2', 'A3'],
  ['B1', 'B2', 'B3'],
  ['C1', 'C2', 'C3'],
  ['D1', 'D2', 'D3'],
]
const LETTER_TO_ROW_MAP: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
}
const ROWS = 4
const COLS = 4
const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1], // NW, N, NE
  [0, -1],
  [0, 1], // W, E
  [1, -1],
  [1, 0],
  [1, 1], // SW, S, SE
]

//  get all surrounding slots for a Flex
export const getFlexSurroundingSlots = (
  slot: DeckSlotId,
  stagingAreaSlots: DeckSlotId[]
): DeckSlotId[] => {
  //  account for staging area slots
  for (let i = 0; i < FLEX_GRID.length; i++) {
    FLEX_GRID[i].push(stagingAreaSlots[i])
  }

  const col = parseInt(slot.charAt(1)) - 1
  const letter = slot.charAt(0)
  const row = LETTER_TO_ROW_MAP[letter]

  const surroungingSlots = []

  for (let [dRow, dCol] of DIRECTIONS) {
    const newRow = row + dRow
    const newCol = col + dCol

    if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
      surroungingSlots.push(FLEX_GRID[newRow][newCol])
    }
  }

  return surroungingSlots
}
