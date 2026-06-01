import { VACUUM_MODULE_ADDRESSABLE_AREAS } from '..'

import type { CoordinateTuple } from '..'
import type { AddressableAreaName, CutoutId } from '../../deck'

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

  const yAdjustment = -10
  const ySlotPosition = slotPosition[1] + yAdjustment
  const xSlotPosition = slotPosition[0] + X_ADJUSTMENT

  // vacuum module addressable areas are single-slot sized (128 × 86 mm bounding box)
  if (VACUUM_MODULE_ADDRESSABLE_AREAS.includes(slotId as AddressableAreaName)) {
    return {
      width: X_DIMENSION_MIDDLE_SLOTS,
      height: Y_DIMENSION,
      x: xSlotPosition,
      y: ySlotPosition,
    }
  }

  const slotFromCutout = slotId
  const isLeftSideofDeck =
    slotFromCutout === 'A1' ||
    slotFromCutout === 'B1' ||
    slotFromCutout === 'C1' ||
    slotFromCutout === 'D1'
  const xAdjustment = isLeftSideofDeck ? X_ADJUSTMENT_LEFT_SIDE : X_ADJUSTMENT
  const xAdjustedSlotPosition = slotPosition[0] + xAdjustment

  const isMiddleOfDeck =
    slotId === 'A2' || slotId === 'B2' || slotId === 'C2' || slotId === 'D2'

  let xDimension = X_DIMENSION_OUTER_SLOTS
  if (isMiddleOfDeck) {
    xDimension = X_DIMENSION_MIDDLE_SLOTS
  } else if (FOURTH_COLUMN_SLOTS.includes(slotId)) {
    xDimension = X_DIMENSION_4TH_COLUMN_SLOTS
  }
  const x = hasTCOnSlot ? xAdjustedSlotPosition + 20 : xAdjustedSlotPosition
  const y = hasTCOnSlot ? ySlotPosition - 70 : ySlotPosition

  return { width: xDimension, height: Y_DIMENSION, x, y }
}

// these TC adjustements are because the TC hover slot
// spans slots 7,8,10,11
const TC_ADJUSTED_Y = 83
const TC_ADJUSTED_W = 260
const TC_ADJUSTED_H = 178

export const getOT2HoverDimensions = (
  hasTCOnSlot: boolean,
  slotPosition: CoordinateTuple,
  // TODO: investigate why the TC adjusted Y is needed for PD???
  forVisualization: boolean
): HoverDimensions => {
  const y = slotPosition[1]
  const x = slotPosition[0]

  return {
    width: hasTCOnSlot ? TC_ADJUSTED_W : 128, // 128 is the standard width
    height: hasTCOnSlot ? TC_ADJUSTED_H : 85, // 85 is the standard height
    x,
    y: hasTCOnSlot && !forVisualization ? y - TC_ADJUSTED_Y : y,
  }
}
