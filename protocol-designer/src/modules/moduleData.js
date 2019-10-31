// @flow

export const SUPPORTED_MODULE_TYPES: Array<ModuleType> = [
  'magdeck',
  'tempdeck',
  'thermocycler',
]

export const SUPPORTED_MODULE_SLOTS = {
  magdeck: [{ name: 'Slot 1 (supported)', value: '1' }],
  tempdeck: [{ name: 'Slot 3 (supported)', value: '3' }],
  thermocycler: [{ name: 'Thermocycler slots', value: 'span7_8_10_11' }],
}

export const ALL_MODULE_SLOTS = [
  { name: 'Slot 1', value: '1' },
  { name: 'Slot 3', value: '3' },
  { name: 'Slot 4', value: '4' },
  { name: 'Slot 6', value: '6' },
  { name: 'Slot 7', value: '7' },
  { name: 'Slot 9', value: '9' },
  { name: 'Slot 10', value: '10' },
]

export function getAllModuleSlotsByType(moduleType: ModuleType) {
  const supportedSlotOption = SUPPORTED_MODULE_SLOTS[moduleType]
  if (moduleType === 'thermocycler') {
    return supportedSlotOption
  }
  const allOtherSlots = ALL_MODULE_SLOTS.filter(
    s => s.value !== supportedSlotOption[0].value
  )
  return supportedSlotOption.concat(allOtherSlots)
}
