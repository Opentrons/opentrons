import {
  getWellGridBoundingBox,
  formLevelValidation,
} from '../formLevelValidation'

// NOTE(IL, 2021-05-18): eventual dependency on definitions.tsx which uses require.context
// would break this test
jest.mock('../../definitions')

describe('getWellGridBoundingBox', () => {
  it('should get the bounding box for circular wells: single-well case', () => {
    const result = getWellGridBoundingBox({
      gridColumns: 1,
      gridRows: 1,
      gridOffsetX: 0,
      gridOffsetY: 0,
      gridSpacingX: 0,
      gridSpacingY: 0,
      wellDiameter: 3,
    })

    expect(result).toEqual({
      topLeftCornerX: -1.5,
      topLeftCornerY: -1.5,
      bottomRightCornerX: 1.5,
      bottomRightCornerY: 1.5,
    })
  })

  it('should get the bounding box for circular wells: multi-well case', () => {
    const result = getWellGridBoundingBox({
      gridColumns: 2,
      gridRows: 3,
      gridOffsetX: 10,
      gridOffsetY: 12,
      gridSpacingX: 1,
      gridSpacingY: 1,
      wellDiameter: 3,
    })

    expect(result).toEqual({
      topLeftCornerX: 10 - 1.5,
      topLeftCornerY: 12 - 1.5,
      bottomRightCornerX: 12.5,
      bottomRightCornerY: 15.5,
    })
  })

  it('should get the bounding box for rectangular wells: single-well case', () => {
    const result = getWellGridBoundingBox({
      gridColumns: 1,
      gridRows: 1,
      gridOffsetX: 0,
      gridOffsetY: 0,
      gridSpacingX: 0,
      gridSpacingY: 0,
      wellXDimension: 3,
      wellYDimension: 2,
    })

    expect(result).toEqual({
      topLeftCornerX: -1.5,
      topLeftCornerY: -1,
      bottomRightCornerX: 1.5,
      bottomRightCornerY: 1,
    })
  })

  it('should get the bounding box for rectangular wells: multi-well case', () => {
    const result = getWellGridBoundingBox({
      gridColumns: 4,
      gridRows: 3,
      gridOffsetX: 8,
      gridOffsetY: 5,
      gridSpacingX: 4.5,
      gridSpacingY: 3.5,
      wellXDimension: 6,
      wellYDimension: 10,
    })

    expect(result).toEqual({
      topLeftCornerX: 8 - 6 / 2,
      topLeftCornerY: 5 - 10 / 2,
      bottomRightCornerX: 8 - 6 / 2 + 4.5 * (4 - 1) + 6,
      bottomRightCornerY: 5 - 10 / 2 + 3.5 * (3 - 1) + 10,
    })
  })
})

// TODO IMMEDIATELY
// describe('formLevelValidation', () => {
//     it('should')
// })
