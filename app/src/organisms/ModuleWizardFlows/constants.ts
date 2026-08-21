import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { ModuleType } from '@opentrons/shared-data'

export const SECTIONS = {
  UPDATE_FIRMWARE: 'UPDATE_FIRMWARE',
  SELECT_LOCATION: 'SELECT_LOCATION',
  CLOSE_DOOR: 'CLOSE_DOOR',
  CHECK_INSTALLATION_PINS: 'CHECK_INSTALLATION_PINS',
  INSTALL_SHUTTLE: 'INSTALL_SHUTTLE',
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  PLACE_ADAPTER: 'PLACE_ADAPTER',
  ATTACH_PROBE: 'ATTACH_PROBE',
  DETACH_PROBE: 'DETACH_PROBE',
  VERIFY_VACUUM: 'VERIFY_VACUUM',
  SUCCESS: 'SUCCESS',
} as const

// Target vacuum a sealed collar should reach within the verification timeout.
export const VERIFY_VACUUM_GAUGE_PRESSURE_MBAR = -500
export const VERIFY_VACUUM_TIMEOUT_S = 30
export const VERIFY_VACUUM_DURATION_S = 35
export const VERIFY_VACUUM_EQUALIZE_TIMEOUT_S = 5

export const ACTIONS = {
  RESTART_FLOW: 'RESTART_FLOW',
  BUILD_FLOW: 'BUILD_FLOW',
  PROCEED: 'PROCEED',
  GO_BACK: 'GO_BACK',
  PATCH_MODULE: 'PATCH_MODULE',
} as const

export const FLOWS = {
  SETUP: 'SETUP',
}

export const CAL_PIN_LOADNAME = 'calibration_pin' as const
export const SCREWDRIVER_LOADNAME = 'hex_screwdriver' as const

export const FLEX_SLOT_NAMES_BY_MOD_TYPE: {
  [moduleType in ModuleType]?: string[]
} = {
  [ABSORBANCE_READER_TYPE]: ['A3', 'B3', 'C3', 'D3'],
  [FLEX_STACKER_MODULE_TYPE]: ['A3', 'B3', 'C3', 'D3'],
  [HEATERSHAKER_MODULE_TYPE]: ['D1', 'C1', 'B1', 'A1', 'D3', 'C3', 'B3', 'A3'],
  [TEMPERATURE_MODULE_TYPE]: ['D1', 'C1', 'B1', 'A1', 'D3', 'C3', 'B3', 'A3'],
  [THERMOCYCLER_MODULE_TYPE]: ['B1'],
  [VACUUM_MODULE_TYPE]: ['A3'],
}
export const LEFT_SLOTS: string[] = ['A1', 'B1', 'C1', 'D1']
