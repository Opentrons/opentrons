import { getModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'

describe('getModuleTypesThatRequireExtraAttention', () => {
  it('should return an empty list when there are no modules', () => {
    expect(getModuleTypesThatRequireExtraAttention([])).toEqual([])
  })
  it('should return an empty list when there is only temperature modules', () => {
    expect(
      getModuleTypesThatRequireExtraAttention([
        'temperatureModuleV1',
        'temperatureModuleV2',
      ])
    ).toEqual([])
  })
  it('should return magnetic module and TC when there are magnetic, temperature, and TC modules', () => {
    expect(
      getModuleTypesThatRequireExtraAttention([
        'temperatureModuleV1',
        'temperatureModuleV2',
        'magneticModuleV1',
        'magneticModuleV2',
        'thermocyclerModuleV1',
      ])
    ).toEqual(['magneticModuleType', 'thermocyclerModuleType'])
  })
})
