// @flow

// NOTE: Ian 2019-10-24 these are by-eye numbers that intentionally
// ignore the real-life data to emphasize overhangs etc

// NOTE: offsets are in the 'left' orientation, eg supported orientation when module is in slots 1/4/7/10
const moduleRenderSizes = {
  magdeck: {
    xOffset: -4,
    yOffset: 0,
    xDimension: 128 + 4 + 4,
    yDimension: 86,
  },
  tempdeck: {
    xOffset: -1 * (128 * 0.5 + 4),
    yOffset: 0,
    xDimension: 128 * 1.5 + 4 + 4,
    yDimension: 86,
  },
  thermocycler: {
    // TODO IMMEDIATELY! these are fake numbers WIP WIP WIP
    xOffset: -4,
    yOffset: 0,
    xDimension: 128 + 4 + 4,
    yDimension: 86,
  },
}

export default moduleRenderSizes
