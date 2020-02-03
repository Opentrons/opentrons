// @flow
// NOTE: Ian 2019-10-24 these are by-eye numbers that intentionally
// ignore the real-life data to emphasize overhangs etc
import {
  STD_SLOT_X_DIM as SLOT_X,
  STD_SLOT_Y_DIM as SLOT_Y,
  STD_SLOT_DIVIDER_WIDTH as DIVIDER,
  SPAN7_8_10_11_SLOT,
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
} from '../../constants'
import type { ModuleType } from '@opentrons/shared-data'
import type { DeckSlot, ModuleOrientation } from '../../types'

// NOTE: all dims are in 'left' orientation. Rotate & transform to obtain 'right' orientation.
export type ModuleVizDims = {|
  xOffset: number,
  yOffset: number,
  xDimension: number,
  yDimension: number,
  childXOffset: number,
  childYOffset: number,
  childXDimension: number,
  childYDimension: number,
|}

const MODULE_VIZ_DIMS: { [ModuleType]: ModuleVizDims } = {
  [MAGDECK]: {
    xOffset: -1 * (SLOT_X * 0.2 + DIVIDER),
    yOffset: -1 * DIVIDER,
    xDimension: SLOT_X * 1.2 + DIVIDER * 2,
    yDimension: SLOT_Y + DIVIDER * 2,
    childXOffset: 0,
    childYOffset: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  [TEMPDECK]: {
    xOffset: -1 * (SLOT_X * 0.4 + DIVIDER),
    yOffset: -1 * DIVIDER,
    xDimension: SLOT_X * 1.4 + DIVIDER * 2,
    yDimension: SLOT_Y + DIVIDER * 2,
    childXOffset: 0,
    childYOffset: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  [THERMOCYCLER]: {
    xOffset: -8,
    yOffset: 0,
    xDimension: SLOT_X + DIVIDER + 32,
    yDimension: SLOT_Y * 2.4,
    childXOffset: 12,
    childYOffset: SLOT_Y,
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

const LEFT_SIDE_SLOTS: Array<DeckSlot> = [
  '1',
  '4',
  '7',
  '10',
  SPAN7_8_10_11_SLOT,
]

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
