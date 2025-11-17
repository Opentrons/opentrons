import type { CoordinateTuple } from '..'
import type { CutoutId } from '../../deck'

interface HoverDimensions {
  width: number
  height: number
  x: number
  y: number
}

const FOURTH_COLUMN_SLOTS = ['A4', 'B4', 'C4', 'D4']

export const getFlexHoverDimensions = (
  columnFourLocations: string[],
  cutoutId: CutoutId,
  slotId: string,
  hasTCOnSlot: boolean,
  slotPosition: CoordinateTuple
): HoverDimensions => {
  const columnFourIsOccupied = columnFourLocations.includes(cutoutId)

  const X_ADJUSTMENT_LEFT_SIDE = -101.5
  const X_ADJUSTMENT = -17
  const X_DIMENSION_MIDDLE_SLOTS = 160.3
  const X_DIMENSION_OUTER_SLOTS = columnFourIsOccupied ? 160.0 : 246.5
  const X_DIMENSION_4TH_COLUMN_SLOTS = 175.0
  const Y_DIMENSION = hasTCOnSlot ? 294.0 : 106.0

  const slotFromCutout = slotId
  const isLeftSideofDeck =
    slotFromCutout === 'A1' ||
    slotFromCutout === 'B1' ||
    slotFromCutout === 'C1' ||
    slotFromCutout === 'D1'
  const xAdjustment = isLeftSideofDeck ? X_ADJUSTMENT_LEFT_SIDE : X_ADJUSTMENT
  const xSlotPosition = slotPosition[0] + xAdjustment

  const yAdjustment = -10
  const ySlotPosition = slotPosition[1] + yAdjustment

  const isMiddleOfDeck =
    slotId === 'A2' || slotId === 'B2' || slotId === 'C2' || slotId === 'D2'

  let xDimension = X_DIMENSION_OUTER_SLOTS
  if (isMiddleOfDeck) {
    xDimension = X_DIMENSION_MIDDLE_SLOTS
  } else if (FOURTH_COLUMN_SLOTS.includes(slotId)) {
    xDimension = X_DIMENSION_4TH_COLUMN_SLOTS
  }
  const x = hasTCOnSlot ? xSlotPosition + 20 : xSlotPosition
  const y = hasTCOnSlot ? ySlotPosition - 70 : ySlotPosition

  return { width: xDimension, height: Y_DIMENSION, x, y }
}

export const getOT2HoverDimensions = (
  hasTCOnSlot: boolean,
  slotPosition: CoordinateTuple
): HoverDimensions => {
  const y = slotPosition[1]
  const x = slotPosition[0]

  return {
    width: hasTCOnSlot ? 260 : 128,
    height: hasTCOnSlot ? 178 : 85,
    x,
    y: hasTCOnSlot ? y - 72 : y,
  }
}
