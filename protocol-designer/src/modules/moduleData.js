// @flow
import {
  SPAN7_8_10_11_SLOT,
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
} from '../constants'
import type { ModuleType } from '@opentrons/shared-data'
import type { DropdownOption } from '@opentrons/components'

export const SUPPORTED_MODULE_TYPES: Array<ModuleType> = [
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
]

type SupportedSlotMap = {
  [type: ModuleType]: Array<DropdownOption>,
}

export const SUPPORTED_MODULE_SLOTS: SupportedSlotMap = {
  magdeck: [{ name: 'Slot 1 (supported)', value: '1' }],
  tempdeck: [{ name: 'Slot 3 (supported)', value: '3' }],
  thermocycler: [{ name: 'Thermocycler slots', value: SPAN7_8_10_11_SLOT }],
}

export const ALL_MODULE_SLOTS: Array<DropdownOption> = [
  { name: 'Slot 1', value: '1' },
  { name: 'Slot 3', value: '3' },
  { name: 'Slot 4', value: '4' },
  { name: 'Slot 6', value: '6' },
  { name: 'Slot 7', value: '7' },
  { name: 'Slot 9', value: '9' },
  { name: 'Slot 10', value: '10' },
]

export function getAllModuleSlotsByType(
  moduleType: ModuleType
): Array<DropdownOption> {
  const supportedSlotOption = SUPPORTED_MODULE_SLOTS[moduleType]
  if (moduleType === THERMOCYCLER) {
    return supportedSlotOption
  }
  const allOtherSlots = ALL_MODULE_SLOTS.filter(
    s => s.value !== supportedSlotOption[0].value
  )
  return supportedSlotOption.concat(allOtherSlots)
}
