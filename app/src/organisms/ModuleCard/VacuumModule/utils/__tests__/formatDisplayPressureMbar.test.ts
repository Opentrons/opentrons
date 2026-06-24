import { describe, expect, it } from 'vitest'

import { formatDisplayPressureMbar } from '../formatDisplayPressureMbar'

describe('formatDisplayPressureMbar', () => {
  it('returns null when pressure is within atmospheric tolerance', () => {
    expect(formatDisplayPressureMbar(-5.2)).toBeNull()
    expect(formatDisplayPressureMbar(4.9)).toBeNull()
    expect(formatDisplayPressureMbar(0)).toBeNull()
  })

  it('rounds to one decimal place outside atmospheric tolerance', () => {
    expect(formatDisplayPressureMbar(-12.34)).toBe(-12.3)
    expect(formatDisplayPressureMbar(-500.04)).toBe(-500)
  })
})
