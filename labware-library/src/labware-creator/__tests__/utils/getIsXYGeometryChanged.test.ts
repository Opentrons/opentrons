import { describe, expect, it, vi } from 'vitest'

import { getDefaultFormState } from '../../fields'
import {
  getIsSideViewGeometryChanged,
  getIsXYGeometryChanged,
} from '../../utils/getIsXYGeometryChanged'

// NOTE(IL, 2021-05-18): eventual dependency on definitions.tsx which uses require.context
// would break this test (though it's not directly used)
vi.mock('../../../definitions')

describe('getIsXYGeometryChanged', () => {
  it('should return true when field(s) that affect XY geometry are changed', () => {
    const result = getIsXYGeometryChanged(getDefaultFormState(), {
      ...getDefaultFormState(),
      gridSpacingX: '2',
    })
    expect(result).toBe(true)
  })

  it('should return false when no fields that affect XY geometry are changed', () => {
    const result = getIsXYGeometryChanged(getDefaultFormState(), {
      ...getDefaultFormState(),
      brand: 'foo',
    })
    expect(result).toBe(false)
  })

  it('should return false when the values object has not been changed at all (identity)', () => {
    const values = getDefaultFormState()
    const result = getIsXYGeometryChanged(values, values)
    expect(result).toBe(false)
  })
})

describe('getIsSideViewGeometryChanged', () => {
  it('returns true when height, depth, bottom shape, or skirt height changes', () => {
    const previous = getDefaultFormState()
    expect(
      getIsSideViewGeometryChanged(previous, {
        ...previous,
        labwareZDimension: '40',
      })
    ).toBe(true)
    expect(
      getIsSideViewGeometryChanged(previous, {
        ...previous,
        wellDepth: '30',
      })
    ).toBe(true)
    expect(
      getIsSideViewGeometryChanged(previous, {
        ...previous,
        wellBottomShape: 'v',
      })
    ).toBe(true)
    expect(
      getIsSideViewGeometryChanged(previous, {
        ...previous,
        skirtHeight: '5',
      })
    ).toBe(true)
  })

  it('returns false when only a top-view field changes', () => {
    const previous = getDefaultFormState()
    expect(
      getIsSideViewGeometryChanged(previous, {
        ...previous,
        gridSpacingX: '2',
      })
    ).toBe(false)
  })
})
