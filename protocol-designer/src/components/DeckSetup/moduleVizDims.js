// @flow
// NOTE: Ian 2019-10-24 these are by-eye numbers that intentionally
// ignore the real-life data to emphasize overhangs etc

const moduleVizDims = {
  magdeck: {
    xOffsetLeft: -4,
    xOffsetRight: -4, // TODO IMMEDIATELY can this be derived?
    yOffset: 0, // TODO IMMEDIATELY does yOffset need left/right?
    xDimension: 128 + 4 + 4,
    yDimension: 86,
    childOffsetX: 0,
    childOffsetY: 0,
    childXDimension: 128,
    childYDimension: 86,
  },
  tempdeck: {
    xOffsetLeft: -1 * (128 * 0.5 + 4),
    xOffsetRight: -4,
    yOffset: 0,
    xDimension: 128 * 1.5 + 4 + 4,
    yDimension: 86,
    childOffsetX: 0,
    childOffsetY: 0,
    childXDimension: 128,
    childYDimension: 86,
  },
  thermocycler: {
    xOffsetLeft: -4,
    xOffsetRight: -4, // Not Applicable, right orientation not supported for thermocycler
    yOffset: 0,
    xDimension: 128 + 4 + 32,
    yDimension: 86 * 2.4,
    childOffsetX: 12,
    childOffsetY: 86,
    childXDimension: 128,
    childYDimension: 86,
  },
}

export default moduleVizDims
