import { vi, describe, it, expect } from 'vitest'
import {
  FORM_LEVEL_ERRORS,
  formLevelValidation,
  getWellGridBoundingBox,
  WELLS_OUT_OF_BOUNDS_X,
  WELLS_OUT_OF_BOUNDS_Y,
} from '../formLevelValidation'
import { getDefaultFormState } from '../fields'
// NOTE(IL, 2021-05-18): eventual dependency on definitions.tsx which uses require.context
// would break this test (though it's not directly used)
vi.mock('../../definitions')

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

describe('formLevelValidation', () => {
  it('should return no errors with the initial values of the form', () => {
    const errors = formLevelValidation({ ...getDefaultFormState() })
    expect(errors).toEqual({})
  })

  it('should return errors when well outside bounding box', () => {
    const errors = formLevelValidation({
      ...getDefaultFormState(),
      footprintXDimension: '86',
      footprintYDimension: '128',
      gridColumns: '2',
      gridOffsetX: '2',
      gridOffsetY: '2',
      gridRows: '2',
      gridSpacingX: '2',
      gridSpacingY: '2',
      wellDiameter: '999', // big ol' well
      labwareType: 'tipRack',
    })
    expect(errors).toEqual({
      [FORM_LEVEL_ERRORS]: {
        [WELLS_OUT_OF_BOUNDS_X]:
          'Grid of tips is larger than labware footprint in the X dimension. Please double check well size, X Spacing, and X Offset.',
        [WELLS_OUT_OF_BOUNDS_Y]:
          'Grid of tips is larger than labware footprint in the Y dimension. Please double check well size, Y Spacing, and Y Offset.',
      },
    })
  })
})
