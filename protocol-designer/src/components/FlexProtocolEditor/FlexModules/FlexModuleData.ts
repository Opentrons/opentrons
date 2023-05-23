import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
} from '@opentrons/shared-data'
import { DropdownOption } from '@opentrons/components'
import { SPAN7_8_10_11_SLOT } from '../../../constants'
export const SUPPORTED_MODULE_TYPES: ModuleType[] = [
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
]

type SupportedSlotMap = Record<ModuleType, DropdownOption[]>

export const SUPPORTED_MODULE_SLOTS: SupportedSlotMap = {
  [MAGNETIC_MODULE_TYPE]: [
    {
      name: 'Slot C1 (default)',
      value: '4',
    },
  ],
  [TEMPERATURE_MODULE_TYPE]: [
    {
      name: 'Slot D3 (default)',
      value: '3',
    },
  ],
  [THERMOCYCLER_MODULE_TYPE]: [
    {
      name: 'Thermocycler slots',
      value: SPAN7_8_10_11_SLOT,
    },
  ],
  [HEATERSHAKER_MODULE_TYPE]: [
    {
      name: 'Slot D1 (default)',
      value: '1',
    },
  ],
  magneticBlockType: [],
}

const ALL_MODULE_SLOTS: DropdownOption[] = [
  {
    name: 'Slot A1',
    value: '10',
  },
  {
    name: 'Slot A2',
    value: '11',
  },
  {
    name: 'Slot A3',
    value: '12',
  },
  {
    name: 'Slot B1',
    value: '7',
  },
  {
    name: 'Slot B2',
    value: '8',
  },
  {
    name: 'Slot B3',
    value: '9',
  },
  {
    name: 'Slot C1',
    value: '4',
  },
  {
    name: 'Slot C2',
    value: '5',
  },
  {
    name: 'Slot C3',
    value: '6',
  },
  {
    name: 'Slot D1',
    value: '1',
  },
  {
    name: 'Slot D2',
    value: '2',
  },
]

const HEATER_SHAKER_SLOTS: DropdownOption[] = [
  {
    name: 'Slot A1',
    value: '10',
  },
  {
    name: 'Slot B1',
    value: '7',
  },
  {
    name: 'Slot C1',
    value: '4',
  },
  {
    name: 'Slot C3',
    value: '6',
  },
  {
    name: 'Slot D1',
    value: '1',
  },
  {
    name: 'Slot D3',
    value: '3',
  },
]

const TEMPERATURE_MODULE_SLOTS: DropdownOption[] = [
  {
    name: 'Slot A1',
    value: '10',
  },
  {
    name: 'Slot B1',
    value: '7',
  },
  {
    name: 'Slot B3',
    value: '9',
  },
  {
    name: 'Slot C1',
    value: '4',
  },
  {
    name: 'Slot C3',
    value: '6',
  },
  {
    name: 'Slot D1',
    value: '1',
  },
  {
    name: 'Slot D3',
    value: '3',
  },
]

export function getAllFlexModuleSlotsByType(
  moduleType: ModuleType
): DropdownOption[] {
  const supportedSlotOption = SUPPORTED_MODULE_SLOTS[moduleType]

  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    return supportedSlotOption
  }

  if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    return supportedSlotOption.concat(
      HEATER_SHAKER_SLOTS.filter(s => s.value !== supportedSlotOption[0].value)
    )
  }

  if (moduleType === TEMPERATURE_MODULE_TYPE) {
    return supportedSlotOption.concat(
      TEMPERATURE_MODULE_SLOTS.filter(
        s => s.value !== supportedSlotOption[0].value
      )
    )
  }

  const allOtherSlots = ALL_MODULE_SLOTS.filter(
    s => s.value !== supportedSlotOption[0].value
  )
  return supportedSlotOption.concat(allOtherSlots)
}
