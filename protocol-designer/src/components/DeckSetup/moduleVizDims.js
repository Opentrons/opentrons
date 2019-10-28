// @flow
// NOTE: Ian 2019-10-24 these are by-eye numbers that intentionally
// ignore the real-life data to emphasize overhangs etc
import {
  STD_SLOT_X_DIM as SLOT_X,
  STD_SLOT_Y_DIM as SLOT_Y,
  STD_SLOT_DIVIDER_WIDTH as DIVIDER,
} from '../../constants'

const moduleVizDims = {
  magdeck: {
    xOffsetLeft: -1 * DIVIDER,
    xOffsetRight: -1 * DIVIDER, // TODO: Ian 2019-10-28 consider deriving the "right" offset...
    yOffset: 0, // TODO: Ian 2019-12-28 if we break Y-symmetry with a future module, we'll need yOffsetLeft + yOffsetRight
    xDimension: SLOT_X + DIVIDER * 2,
    yDimension: SLOT_Y,
    childOffsetX: 0,
    childOffsetY: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  tempdeck: {
    xOffsetLeft: -1 * (SLOT_X * 0.5 + 4),
    xOffsetRight: -1 * DIVIDER,
    yOffset: 0,
    xDimension: SLOT_X * 1.5 + DIVIDER * 2,
    yDimension: SLOT_Y,
    childOffsetX: 0,
    childOffsetY: 0,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
  thermocycler: {
    xOffsetLeft: -1 * DIVIDER,
    xOffsetRight: -1 * DIVIDER, // Not Applicable, right orientation not supported for thermocycler
    yOffset: 0,
    xDimension: SLOT_X + DIVIDER + 32,
    yDimension: SLOT_Y * 2.4,
    childOffsetX: 12,
    childOffsetY: SLOT_Y,
    childXDimension: SLOT_X,
    childYDimension: SLOT_Y,
  },
}

export default moduleVizDims
