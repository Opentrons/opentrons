import { getLabwareSlot } from '../utils'

describe('getLabwareSlot', () => {
  it('should return the slot the labware is in when it is NOT on top of a module', () => {
    const labware = {
      someLabwareId: { slot: '1' },
    }
    const modules = {}

    expect(getLabwareSlot('someLabwareId', labware, modules)).toBe('1')
  })
  it('should return the slot the labware is in when it is on top of a module', () => {
    const labware = {
      someLabwareId: { slot: 'someModuleId' },
    }
    const modules = {
      someModuleId: { slot: '2', moduleState: {} as any },
    }

    expect(getLabwareSlot('someLabwareId', labware, modules)).toBe('2')
  })
})
