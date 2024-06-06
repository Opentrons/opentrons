import { vi, describe, it, expect } from 'vitest'
import { getDefaultFormState } from '../../fields'
import { getIsXYGeometryChanged } from '../../utils/getIsXYGeometryChanged'
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
