import { describe, expect, it } from 'vitest'

import { getVacuumPumpHoldArgsPython } from '../getVacuumPumpHoldArgsPython'

describe('getVacuumPumpHoldArgsPython', () => {
  it('emits duration only when ventAfter is omitted', () => {
    expect(getVacuumPumpHoldArgsPython(30)).toEqual(['duration_s=30'])
  })

  it('emits duration and vent_after when ventAfter is true', () => {
    expect(getVacuumPumpHoldArgsPython(10, true)).toEqual([
      'duration_s=10',
      'vent_after=True',
    ])
  })

  it('emits duration and vent_after when ventAfter is false', () => {
    expect(getVacuumPumpHoldArgsPython(10, false)).toEqual([
      'duration_s=10',
      'vent_after=False',
    ])
  })

  it('formats non-integer duration like Python numbers', () => {
    expect(getVacuumPumpHoldArgsPython(1.5)).toEqual(['duration_s=1.5'])
  })
})
