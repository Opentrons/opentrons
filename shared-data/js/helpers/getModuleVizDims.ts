// NOTE: Ian 2019-10-24 these are by-eye numbers that intentionally
// ignore the real-life data to emphasize overhangs etc
import { SPAN7_8_10_11_SLOT } from '../constants'
import type { ModuleOrientation } from '../types'
// NOTE: all dims are in 'left' orientation. Rotate & transform to obtain 'right' orientation.

export interface ModuleVizDims {
  xOffset: number
  yOffset: number
  xDimension: number
  yDimension: number
  childXOffset: number
  childYOffset: number
  childXDimension: number
  childYDimension: number
}
type DeckSlot = string
const LEFT_SIDE_SLOTS: DeckSlot[] = ['1', '4', '7', '10', SPAN7_8_10_11_SLOT]
export const inferModuleOrientationFromSlot = (
  slot: DeckSlot
): ModuleOrientation => {
  // NOTE: defaults to 'left' even for center slots and spanning slots.
  // That's consistent with non-rotatable modules (thermocycler) being
  // considered as 'left' all the time, like we do in MODULE_VIZ_DIMS.
  if (!LEFT_SIDE_SLOTS.includes(slot)) {
    return 'right'
  }

  return 'left'
}

export const inferModuleOrientationFromXCoordinate = (
  xCoordinate: number
): ModuleOrientation => {
  if (xCoordinate === 0) {
    return 'left'
  }
  return 'right'
}
