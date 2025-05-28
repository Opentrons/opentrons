import { describe, expect, it } from 'vitest'

import { getLabwareSlot } from '../utils'

describe('getLabwareSlot', () => {
  it('should return the slot the labware is in when it is NOT on top of a module', () => {
    const labware = {
      someLabwareId: { stack: ['someLabwareId', '1'] },
    }

    expect(getLabwareSlot('someLabwareId', labware)).toBe('1')
  })
  it('should return the slot the labware is in when it is on top of a module', () => {
    const labware = {
      someLabwareId: { stack: ['someLabwareId', 'someModuleId', '2'] },
    }

    expect(getLabwareSlot('someLabwareId', labware)).toBe('2')
  })
})
