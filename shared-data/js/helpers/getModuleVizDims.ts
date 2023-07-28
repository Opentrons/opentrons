// NOTE: Ian 2019-10-24 these are by-eye numbers that intentionally
// ignore the real-life data to emphasize overhangs etc
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  STD_SLOT_X_DIM as SLOT_X,
  STD_SLOT_Y_DIM as SLOT_Y,
  STD_SLOT_DIVIDER_WIDTH as DIVIDER,
  SPAN7_8_10_11_SLOT,
  MAGNETIC_BLOCK_TYPE,
} from '../constants'
import { ModuleType, ModuleOrientation } from '../types'
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
const MODULE_VIZ_DIMS: Record<ModuleType, ModuleVizDims> = {
  [MAGNETIC_MODULE_TYPE]: {
    xOffset: -1 * (SLOT_X * 0.2 + DIVIDER),
    yOffset: -1 * DIVIDER,
    xDimension: SLOT_X * 1.2 + DIVIDER * 2,
    yDimension: SLOT_Y + DIVIDER * 2,
    childXOffset: 0,
    childYOffset: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  [TEMPERATURE_MODULE_TYPE]: {
    xOffset: -1 * (SLOT_X * 0.4 + DIVIDER),
    yOffset: -1 * DIVIDER,
    xDimension: SLOT_X * 1.4 + DIVIDER * 2,
    yDimension: SLOT_Y + DIVIDER * 2,
    childXOffset: 0,
    childYOffset: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  [THERMOCYCLER_MODULE_TYPE]: {
    xOffset: -8,
    yOffset: 0,
    xDimension: SLOT_X + DIVIDER + 32,
    yDimension: SLOT_Y * 2.4,
    childXOffset: 12,
    childYOffset: SLOT_Y,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  // TODO(sh, 2022-02-28): This is stubbed out using magdeck dimensions, all of this logic should be deprecated
  [HEATERSHAKER_MODULE_TYPE]: {
    xOffset: -1 * (SLOT_X * 0.2 + DIVIDER),
    yOffset: -1 * DIVIDER,
    xDimension: SLOT_X * 1.2 + DIVIDER * 2,
    yDimension: SLOT_Y + DIVIDER * 2,
    childXOffset: 0,
    childYOffset: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  // TODO(sh, 2022-02-28): This is stubbed out using magdeck dimensions, all of this logic should be deprecated
  [MAGNETIC_BLOCK_TYPE]: {
    xOffset: -1 * (SLOT_X * 0.2 + DIVIDER),
    yOffset: -1 * DIVIDER,
    xDimension: SLOT_X * 1.2 + DIVIDER * 2,
    yDimension: SLOT_Y + DIVIDER * 2,
    childXOffset: 0,
    childYOffset: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
}
export const getModuleVizDims = (
  orientation: ModuleOrientation,
  moduleType: ModuleType
): ModuleVizDims => {
  const dims = MODULE_VIZ_DIMS[moduleType]
  if (orientation === 'left') return dims
  // if orientation is 'right', get origins by rotating 180 about slot center
  return {
    ...dims,
    xOffset: SLOT_X - dims.xOffset - dims.xDimension,
    yOffset: SLOT_Y - dims.yOffset - dims.yDimension,
    childXOffset: SLOT_X - dims.childXOffset - dims.childXDimension,
    childYOffset: SLOT_Y - dims.childYOffset - dims.childYDimension,
  }
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
