import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type {
  AddressableOffsetVector,
  DeckSlotId,
  FlexStackerStoredLabwareGroup,
  ModuleModel,
  ModuleType,
  OT2AddressableAreaName,
} from '@opentrons/shared-data'
import type {
  AbsorbanceReaderState,
  FlexStackerModuleState,
  HeaterShakerModuleState,
  MagneticBlockState,
  MagneticModuleState,
  ModuleState,
  TemperatureModuleState,
  ThermocyclerModuleState,
} from './types'

// Temperature statuses
export const TEMPERATURE_DEACTIVATED: 'TEMPERATURE_DEACTIVATED' =
  'TEMPERATURE_DEACTIVATED'
export const TEMPERATURE_AT_TARGET: 'TEMPERATURE_AT_TARGET' =
  'TEMPERATURE_AT_TARGET'
export const TEMPERATURE_APPROACHING_TARGET: 'TEMPERATURE_APPROACHING_TARGET' =
  'TEMPERATURE_APPROACHING_TARGET'
export const AIR_GAP_OFFSET_FROM_TOP = 1
export const MODULES_WITH_COLLISION_ISSUES: ModuleModel[] = [
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
]
export const FIXED_TRASH_ID: 'fixedTrash' = 'fixedTrash'

export const MAGNETIC_MODULE_INITIAL_STATE: MagneticModuleState = {
  type: MAGNETIC_MODULE_TYPE,
  engaged: false,
}
export const TEMPERATURE_MODULE_INITIAL_STATE: TemperatureModuleState = {
  type: TEMPERATURE_MODULE_TYPE,
  status: TEMPERATURE_DEACTIVATED,
  targetTemperature: null,
}
export const THERMOCYCLER_MODULE_INITIAL_STATE: ThermocyclerModuleState = {
  type: THERMOCYCLER_MODULE_TYPE,
  currentBlockActivity: { type: 'blockDeactivated' },
  lidTargetTemp: null,
  lidOpen: null,
  numProfilesStarted: 0,
}
export const HEATERSHAKER_MODULE_INITIAL_STATE: HeaterShakerModuleState = {
  type: HEATERSHAKER_MODULE_TYPE,
  targetTemp: null,
  targetSpeed: null,
  latchOpen: null,
}
export const ABSORBANCE_READER_INITIAL_STATE: AbsorbanceReaderState = {
  type: 'absorbanceReaderType',
  lidOpen: null,
  initialization: null,
}
export const MAGNETIC_BLOCK_INITIAL_STATE: MagneticBlockState = {
  type: 'magneticBlockType',
}

export const FLEX_STACKER_MODULE_INITIAL_STATE: FlexStackerModuleState = {
  type: FLEX_STACKER_MODULE_TYPE,
  storedLabwareDetails: null,
  labwareInHopper: null,
  labwareOnShuttle: null,
  labwareFillQueue: null,
}

export const MODULE_INITIAL_STATE_BY_TYPE: {
  [moduleType in ModuleType]: ModuleState
} = {
  [MAGNETIC_MODULE_TYPE]: MAGNETIC_MODULE_INITIAL_STATE,
  [TEMPERATURE_MODULE_TYPE]: TEMPERATURE_MODULE_INITIAL_STATE,
  [THERMOCYCLER_MODULE_TYPE]: THERMOCYCLER_MODULE_INITIAL_STATE,
  [HEATERSHAKER_MODULE_TYPE]: HEATERSHAKER_MODULE_INITIAL_STATE,
  [ABSORBANCE_READER_TYPE]: ABSORBANCE_READER_INITIAL_STATE,
  [MAGNETIC_BLOCK_TYPE]: MAGNETIC_BLOCK_INITIAL_STATE,
  [FLEX_STACKER_MODULE_TYPE]: FLEX_STACKER_MODULE_INITIAL_STATE,
} as const

MODULE_INITIAL_STATE_BY_TYPE satisfies {
  [moduleType in ModuleType]: ModuleState
}

export const OT_2_TRASH_DEF_URI = 'opentrons/opentrons_1_trash_1100ml_fixed/1'
export const FLEX_TRASH_DEF_URI = 'opentrons/opentrons_1_trash_3200ml_fixed/1'
export const COLUMN_4_SLOTS = ['A4', 'B4', 'C4', 'D4']
export const ZERO_OFFSET: AddressableOffsetVector = { x: 0, y: 0, z: 0 }

export const GRIPPER_LOCATION: 'mounted' = 'mounted'

export const CLEAN: 'CLEAN' = 'CLEAN'
export const DIRTY: 'DIRTY' = 'DIRTY'
export const EMPTY: 'EMPTY' = 'EMPTY'

export const AUTOMATIC: 'automatic' = 'automatic'
export const MANUAL: 'manual' = 'manual'

export const STAGING_AREA_SLOTS = ['A4', 'B4', 'C4', 'D4']

export const OT2_TC_SLOTS: OT2AddressableAreaName[] = ['7', '8', '10', '11']

export const HOPPER_STACKER_LOCATION = 'hopper'

export const HOPPER_FAKE_LOCATIONS = [
  'hopperA4',
  'hopperB4',
  'hopperC4',
  'hopperD4',
]

export const FAKE_HOPPER_LOCATION_MAP = {
  hopperA4: 'A4',
  hopperB4: 'B4',
  hopperC4: 'C4',
  hopperD4: 'D4',
}

export type HopperLocationMapKey = keyof typeof FAKE_HOPPER_LOCATION_MAP

export const BOTTOM_UP_LABWARE_POOL_KEYS: Array<
  keyof FlexStackerStoredLabwareGroup
> = ['adapterLabwareId', 'primaryLabwareId', 'lidLabwareId']

export const SLOT_LOCATIONS_TO_FAKE_HOPPER_LOCATIONS: Record<
  DeckSlotId,
  string
> = {
  A4: 'hopperA4',
  B4: 'hopperB4',
  C4: 'hopperC4',
  D4: 'hopperD4',
}
