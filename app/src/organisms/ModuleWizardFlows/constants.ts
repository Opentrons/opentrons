import {
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

export const SECTIONS = {
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  FIRMWARE_UPDATE: 'FIRMWARE_UPDATE',
  SELECT_LOCATION: 'SELECT_LOCATION',
  PLACE_ADAPTER: 'PLACE_ADAPTER',
  ATTACH_PROBE: 'ATTACH_PROBE',
  DETACH_PROBE: 'DETACH_PROBE',
  SUCCESS: 'SUCCESS',
} as const

export const FLOWS = {
  CALIBRATE: 'CALIBRATE',
}

export const CAL_PIN_LOADNAME = 'calibration_pin' as const
export const SCREWDRIVER_LOADNAME = 'hex_screwdriver' as const

export const FLEX_SLOT_NAMES_BY_MOD_TYPE: {
  [moduleType in ModuleType]?: string[]
} = {
  [HEATERSHAKER_MODULE_TYPE]: ['D1', 'C1', 'B1', 'A1', 'D3', 'C3', 'B3', 'A3'],
  [TEMPERATURE_MODULE_TYPE]: ['D1', 'C1', 'B1', 'A1', 'D3', 'C3', 'B3', 'A3'],
  [THERMOCYCLER_MODULE_TYPE]: ['B1'],
}
export const LEFT_SLOTS: string[] = ['A1', 'B1', 'C1', 'D1']
