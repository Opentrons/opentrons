import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { DropdownOption } from '@opentrons/components'
import type { ModuleType } from '@opentrons/shared-data'

export const SUPPORTED_MODULE_TYPES: ModuleType[] = [
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  ABSORBANCE_READER_TYPE,
]
type SupportedSlotMap = Record<ModuleType, DropdownOption[]>
export const SUPPORTED_MODULE_SLOTS_OT2: SupportedSlotMap = {
  [MAGNETIC_MODULE_TYPE]: [
    {
      name: '1',
      value: '1',
    },
  ],
  [TEMPERATURE_MODULE_TYPE]: [
    {
      name: '3',
      value: '3',
    },
  ],
  [THERMOCYCLER_MODULE_TYPE]: [
    {
      name: '7,8,10,11',
      value: '7',
    },
  ],
  [HEATERSHAKER_MODULE_TYPE]: [
    {
      name: '1',
      value: '1',
    },
  ],
  [MAGNETIC_BLOCK_TYPE]: [
    {
      name: '1',
      value: '1',
    },
  ],
  [ABSORBANCE_READER_TYPE]: [],
  [FLEX_STACKER_MODULE_TYPE]: [],
}

export const ALL_MODULE_SLOTS_OT2: DropdownOption[] = [
  {
    name: '1',
    value: '1',
  },
  {
    name: '3',
    value: '3',
  },
  {
    name: '4',
    value: '4',
  },
  {
    name: '6',
    value: '6',
  },
  {
    name: '7',
    value: '7',
  },
  {
    name: '9',
    value: '9',
  },
  {
    name: '10',
    value: '10',
  },
]

const HEATER_SHAKER_SLOTS_OT2: DropdownOption[] = [
  {
    name: '1',
    value: '1',
  },
  {
    name: '3',
    value: '3',
  },
  {
    name: '4',
    value: '4',
  },
  {
    name: '6',
    value: '6',
  },
  {
    name: '7',
    value: '7',
  },
  {
    name: '10',
    value: '10',
  },
]

export function getAllModuleSlotsByTypeOt2(
  moduleType: ModuleType
): DropdownOption[] {
  const supportedSlotOption = SUPPORTED_MODULE_SLOTS_OT2[moduleType]

  let slot = supportedSlotOption

  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    slot = supportedSlotOption
  } else if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    slot = supportedSlotOption.concat(
      HEATER_SHAKER_SLOTS_OT2.filter(
        s => s.value !== supportedSlotOption[0].value
      )
    )
  } else {
    const allOtherSlots = ALL_MODULE_SLOTS_OT2.filter(
      s => s.value !== supportedSlotOption[0].value
    )
    slot = supportedSlotOption.concat(allOtherSlots)
  }
  return slot
}
