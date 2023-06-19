import {
  ALL_MODULE_SLOTS,
  HEATER_SHAKER_SLOTS,
  SUPPORTED_MODULE_SLOTS,
  TEMPERATURE_MODULE_SLOTS,
  getAllFlexModuleSlotsByType,
} from '../FlexModuleData'
import {
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'

describe('FlexModuleData', () => {
  it('getAllFlexModuleSlotsByType should return an array of DropdownOption', () => {
    const result = getAllFlexModuleSlotsByType(THERMOCYCLER_MODULE_TYPE)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('getAllFlexModuleSlotsByType should return supportedSlotOption for THERMOCYCLER_MODULE_TYPE', () => {
    const result = getAllFlexModuleSlotsByType(THERMOCYCLER_MODULE_TYPE)
    const supportedSlotOption = SUPPORTED_MODULE_SLOTS[THERMOCYCLER_MODULE_TYPE]
    expect(result).toEqual(supportedSlotOption)
  })

  it('getAllFlexModuleSlotsByType should return supportedSlotOption concatenated with HEATER_SHAKER_SLOTS for HEATERSHAKER_MODULE_TYPE', () => {
    const result = getAllFlexModuleSlotsByType(HEATERSHAKER_MODULE_TYPE)
    const supportedSlotOption = SUPPORTED_MODULE_SLOTS[HEATERSHAKER_MODULE_TYPE]
    const expected = supportedSlotOption.concat(
      HEATER_SHAKER_SLOTS.filter(s => s.value !== supportedSlotOption[0].value)
    )
    expect(result).toEqual(expected)
  })

  it('getAllFlexModuleSlotsByType should return supportedSlotOption concatenated with TEMPERATURE_MODULE_SLOTS for TEMPERATURE_MODULE_TYPE', () => {
    const result = getAllFlexModuleSlotsByType(TEMPERATURE_MODULE_TYPE)
    const supportedSlotOption = SUPPORTED_MODULE_SLOTS[TEMPERATURE_MODULE_TYPE]
    const expected = supportedSlotOption.concat(
      TEMPERATURE_MODULE_SLOTS.filter(
        s => s.value !== supportedSlotOption[0].value
      )
    )
    expect(result).toEqual(expected)
  })

  it('getAllFlexModuleSlotsByType should return supportedSlotOption concatenated with all other slots for any other module type', () => {
    const result = getAllFlexModuleSlotsByType('SOME_OTHER_MODULE_TYPE')
    const supportedSlotOption = SUPPORTED_MODULE_SLOTS['SOME_OTHER_MODULE_TYPE']
    const expected = supportedSlotOption?.concat(
      ALL_MODULE_SLOTS.filter(s => s.value !== supportedSlotOption[0].value)
    )
    expect(result).toEqual(expected)
  })
})
